# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import json
import logging
import os
import shutil
import subprocess
import tempfile

import cv2
from bson import ObjectId

from migration.utils import FeatureFlagProvider, IMigrationScript, MongoDBConnection
from migration.utils.connection import MinioStorageClient

logger = logging.getLogger(__name__)

BUCKET_NAME_VIDEOS = os.environ.get("BUCKET_NAME_VIDEOS", "videos")


class ConvertVFRVideosToCFR(IMigrationScript):
    """
    Migration script that checks if any video has a variable frame rate. If this is the case,
    extract and save every frame, then reconstruct the video using the fps from get_fps method.
    The new constant frame rate video overwrites the old variable framerate video stored in the VideoBinaryRepo.

    This migration needs to extract every frame to ensure existing annotations still align with the video.
    """

    @classmethod
    def upgrade_project(cls, organization_id: str, workspace_id: str, project_id: str) -> None:
        if not FeatureFlagProvider.is_enabled("FEATURE_FLAG_MIGRATE_VFR_TO_CFR_VIDEOS"):
            logger.warning("FEATURE_FLAG_MIGRATE_VFR_TO_CFR_VIDEOS not enabled, skipping migration.")
            return
        db = MongoDBConnection().geti_db
        storage_client = MinioStorageClient().client
        storage_prefix = f"organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}"

        video_collection = db.get_collection("video")
        dataset_storage_collection = db.get_collection("dataset_storage")

        dataset_storages = list(dataset_storage_collection.find({"project_id": ObjectId(project_id)}))

        for dataset_storage in dataset_storages:
            dataset_storage_id = dataset_storage["_id"]
            videos = list(video_collection.find({"dataset_storage_id": dataset_storage_id}))
            ds_storage_prefix = f"{storage_prefix}/dataset_storages/{dataset_storage_id}"

            for video in videos:
                video_id = video["_id"]
                video_extension = video["extension"]
                video_path = f"{ds_storage_prefix}/{video_id}.{video_extension.lower()}"

                try:
                    # Get presigned URL for the video
                    url = storage_client.presigned_get_object(BUCKET_NAME_VIDEOS, video_path)

                    # Check if video is VFR
                    if cls._is_variable_frame_rate(url):
                        logger.info(f"Converting VFR video {video_id} to CFR")

                        # Get the FPS for reconstruction
                        fps = cls._get_video_fps(url)

                        # Convert VFR to CFR
                        converted_file = cls._convert_vfr_to_cfr(url, fps)
                        if converted_file:
                            # Upload the converted video back to storage
                            with open(converted_file, "rb") as f:
                                storage_client.put_object(
                                    BUCKET_NAME_VIDEOS, video_path, f, length=os.path.getsize(converted_file)
                                )

                            # Clean up temporary file
                            os.unlink(converted_file)

                            logger.info(f"Successfully converted and replaced VFR video {video_id}")
                        else:
                            logger.error(f"Failed to convert VFR video {video_id}")
                    else:
                        logger.debug(f"Video {video_id} is already CFR, skipping")

                except Exception as e:
                    logger.error(f"Failed to process video {video_id}: {e}")
                    continue

    @classmethod
    def _get_video_fps(cls, video_path: str) -> float:
        """
        Get video FPS using ffprobe. Copied logic from VideoDecoder.get_fps.

        :param video_path: Local path or presigned S3 URL pointing to the video
        :return: Video FPS as float
        """
        result = subprocess.run(  # noqa: S603
            [  # noqa: S607
                "ffprobe",
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=r_frame_rate",
                "-of",
                "json",
                video_path,
            ],
            capture_output=True,
            check=False,
        )
        ffprobe_output = json.loads(result.stdout)
        r_frame_rate = ffprobe_output["streams"][0]["r_frame_rate"]
        num, denominator = map(int, r_frame_rate.split("/"))
        return num / denominator

    @classmethod
    def _is_variable_frame_rate(cls, video_path: str) -> bool:
        """
        Check if a video has variable frame rate. Copied logic from VideoDecoder.is_variable_frame_rate.

        :param video_path: Local path or presigned S3 URL pointing to the video
        :return: True if the video has variable frame rate, False if constant frame rate
        """
        # Get r_frame_rate
        r_frame_rate_result = subprocess.run(  # noqa: S603
            [  # noqa: S607
                "ffprobe",
                "-v",
                "0",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=r_frame_rate",
                "-of",
                "csv=p=0",
                video_path,
            ],
            capture_output=True,
            check=False,
            text=True,
        )

        # Get avg_frame_rate
        avg_frame_rate_result = subprocess.run(  # noqa: S603
            [  # noqa: S607
                "ffprobe",
                "-v",
                "0",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=avg_frame_rate",
                "-of",
                "csv=p=0",
                video_path,
            ],
            capture_output=True,
            check=False,
            text=True,
        )

        if r_frame_rate_result.returncode != 0 or avg_frame_rate_result.returncode != 0:
            logger.warning("ffprobe failed, could not determine frame rate.")
            return False

        r_frame_rate = r_frame_rate_result.stdout.strip()
        avg_frame_rate = avg_frame_rate_result.stdout.strip()

        # Convert rates to decimals for comparison (handle fractions like 30000/1001)
        def fraction_to_decimal(rate_str: str):
            if "/" in rate_str:
                numerator, denominator = map(int, rate_str.split("/"))
                return numerator / denominator if denominator != 0 else 0
            return float(rate_str)

        r_frame_rate_decimal = fraction_to_decimal(r_frame_rate)
        avg_frame_rate_decimal = fraction_to_decimal(avg_frame_rate)

        # If r_frame_rate and avg_frame_rate are not equal, it's VFR
        return r_frame_rate_decimal != avg_frame_rate_decimal

    @classmethod
    def _convert_vfr_to_cfr(cls, input_path: str, target_fps: float) -> str | None:
        """
        Convert a variable frame rate video to constant frame rate by extracting all frames
        and then reconstructing the video.

        :param input_path: Path to the input VFR video (can be presigned URL)
        :param target_fps: Target frame rate for the output video
        :return: Path to temporary converted file if successful, None otherwise
        """
        temp_dir = None
        temp_output_path = None

        try:
            # Create temporary directory for frames
            temp_dir = tempfile.mkdtemp(prefix="vfr_conversion_")

            # Create temporary file for output
            temp_fd, temp_output_path = tempfile.mkstemp(suffix=".mp4")
            os.close(temp_fd)  # Close file descriptor, we only need the path

            # Step 1: Extract all frames from the video
            logger.info("Extracting all frames from VFR video")
            if not cls._extract_all_frames(input_path, temp_dir):
                logger.error("Failed to extract frames")
                return None

            # Step 2: Reconstruct video from extracted frames
            logger.info("Reconstructing CFR video from extracted frames")
            if not cls._stitch_frames_to_cfr_video(temp_dir, temp_output_path, target_fps):
                logger.error("Failed to reconstruct video from frames")
                return None

            logger.info(f"Successfully converted VFR video to CFR: {temp_output_path}")
            return temp_output_path

        except Exception as e:
            logger.error(f"Error during VFR to CFR conversion: {str(e)}")
            # Clean up failed temp file
            if temp_output_path and os.path.exists(temp_output_path):
                os.unlink(temp_output_path)
            return None
        finally:
            # Clean up temporary directory
            if temp_dir and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)

    @classmethod
    def _extract_all_frames(cls, video_path: str, output_dir: str) -> bool:
        """
        Extract all frames from a video file using the same logic as the opencv video decoder.
        Based on extract_all_frames from vfr_converter.py using VideoDecoder.

        :param video_path: Path to the input video (can be presigned URL)
        :param output_dir: Directory to save extracted frames
        :return: True if successful, False otherwise
        """
        try:
            # Create output directory if it doesn't exist
            os.makedirs(output_dir, exist_ok=True)

            # Get video information
            video_reader = cv2.VideoCapture(video_path, cv2.CAP_FFMPEG)
            total_frames = int(video_reader.get(cv2.CAP_PROP_FRAME_COUNT))

            logger.info(f"Extracting {total_frames} frames from {video_path}")

            # Extract all frames
            for frame_index in range(total_frames):
                try:
                    frame_filename = os.path.join(output_dir, f"frame_{frame_index:06d}.png")
                    video_reader_frame_pos = int(video_reader.get(cv2.CAP_PROP_POS_FRAMES))
                    if video_reader_frame_pos != frame_index:
                        video_reader.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
                    read_success, frame_bgr = video_reader.read()
                    if not read_success:
                        if frame_index > 0:
                            # Copy the last successfully saved frame and update its index
                            last_frame_filename = os.path.join(output_dir, f"frame_{frame_index - 1:06d}.png")
                            shutil.copy(last_frame_filename, frame_filename)
                            logger.warning(
                                f"Failed to read frame at index {frame_index}, copied previous frame instead"
                            )
                            continue
                        raise RuntimeError(f"Failed to read frame at index {frame_index} and no previous frame to copy")

                    # Save frame
                    cv2.imwrite(frame_filename, frame_bgr)

                    if (frame_index + 1) % 100 == 0:
                        logger.info(f"Extracted {frame_index + 1}/{total_frames} frames")

                except Exception as e:
                    logger.error(f"Error extracting frame {frame_index}: {str(e)}")
                    continue

            logger.info(f"Successfully extracted all frames to {output_dir}")
            return True

        except Exception as e:
            logger.error(f"Error during frame extraction: {str(e)}")
            return False

    @classmethod
    def _stitch_frames_to_cfr_video(cls, frames_dir: str, output_path: str, fps: float) -> bool:
        """
        Stitch extracted frames into a constant frame rate video using ffmpeg.
        Based on stitch_frames_to_cfr_video from vfr_converter.py.

        :param frames_dir: Directory containing the extracted frames
        :param output_path: Path where the CFR video will be saved
        :param fps: Target frame rate for the output video
        :return: True if successful, False otherwise
        """
        try:
            # Check if frames directory exists and has frames
            if not os.path.exists(frames_dir):
                logger.error(f"Frames directory '{frames_dir}' does not exist")
                return False

            frame_files = sorted([f for f in os.listdir(frames_dir) if f.endswith(".png")])
            if not frame_files:
                logger.error(f"No PNG frames found in '{frames_dir}'")
                return False

            logger.info(f"Stitching {len(frame_files)} frames into CFR video at {fps} fps")

            # Use ffmpeg to create video from image sequence
            process = subprocess.run(  # noqa: S603
                [  # noqa: S607
                    "ffmpeg",
                    "-y",  # Overwrite output file
                    "-framerate",
                    str(fps),  # Input framerate
                    "-i",
                    os.path.join(frames_dir, "frame_%06d.png"),  # Input pattern
                    "-c:v",
                    "libx264",  # Video codec
                    "-preset",
                    "slow",  # Encoding preset for quality
                    "-crf",
                    "18",  # Quality setting
                    "-pix_fmt",
                    "yuv420p",  # Pixel format for compatibility
                    "-r",
                    str(fps),  # Output framerate
                    "-an",  # Remove audio because video length might differ
                    output_path,
                ],
                capture_output=True,
                text=True,
                timeout=7200,
                check=False,
            )

            if process.returncode == 0:
                logger.info(f"Successfully stitched frames into CFR video: {output_path}")
                return True
            logger.error(f"FFmpeg stitching failed with return code {process.returncode}")
            logger.error(f"FFmpeg stderr: {process.stderr}")
            return False

        except subprocess.TimeoutExpired:
            logger.error(f"FFmpeg stitching timed out for {frames_dir}")
            return False
        except Exception as e:
            logger.error(f"Error during frame stitching: {str(e)}")
            return False

    @classmethod
    def downgrade_project(cls, organization_id: str, workspace_id: str, project_id: str) -> None:
        """
        Downgrade is not necessary.
        """

    @classmethod
    def downgrade_non_project_data(cls) -> None:
        pass

    @classmethod
    def upgrade_non_project_data(cls) -> None:
        pass
