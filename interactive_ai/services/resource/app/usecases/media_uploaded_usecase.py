# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import logging
import os
import tempfile
from tempfile import TemporaryDirectory
from typing import Any

from PIL import Image as PILImage

from geti_kafka_tools import publish_event
from geti_types import CTX_SESSION_VAR, ID
from iai_core.adapters.binary_interpreters import StreamBinaryInterpreter
from iai_core.entities.dataset_storage import DatasetStorageIdentifier
from iai_core.entities.image import Image
from iai_core.entities.video import Video
from iai_core.repos.storage.binary_repos import ImageBinaryRepo, ThumbnailBinaryRepo, VideoBinaryRepo
from iai_core.utils.constants import DEFAULT_THUMBNAIL_SIZE
from iai_core.utils.media_factory import Media2DFactory
from media_utils import VideoDecoder, VideoFrameReader, generate_thumbnail_video

logger = logging.getLogger(__name__)


class MediaUploadedUseCase:
    @staticmethod
    def on_media_uploaded(
        dataset_storage_identifier: DatasetStorageIdentifier, media_type: str, media_id: ID, data_binary_filename: str
    ) -> None:
        MediaUploadedUseCase.publish_media_preprocessing_event(
            dataset_storage_identifier=dataset_storage_identifier,
            media_id=media_id,
            media_type=media_type,
            event="MEDIA_PREPROCESSING_STARTED",
        )

        try:
            if media_type == "IMAGE":
                MediaUploadedUseCase.on_image_uploaded(
                    dataset_storage_identifier=dataset_storage_identifier,
                    image_id=media_id,
                    data_binary_filename=data_binary_filename,
                )
            elif media_type == "VIDEO":
                MediaUploadedUseCase.on_video_uploaded(
                    dataset_storage_identifier=dataset_storage_identifier,
                    video_id=media_id,
                    data_binary_filename=data_binary_filename,
                )
            preprocessing: dict[str, Any] = {"success": True}
        except Exception as ex:
            preprocessing = {"success": False, "message": str(ex)}

        MediaUploadedUseCase.publish_media_preprocessing_event(
            dataset_storage_identifier=dataset_storage_identifier,
            media_id=media_id,
            media_type=media_type,
            event="MEDIA_PREPROCESSING_FINISHED",
            preprocessing=preprocessing,
        )

    @staticmethod
    def on_image_uploaded(
        dataset_storage_identifier: DatasetStorageIdentifier, image_id: ID, data_binary_filename: str
    ) -> None:
        """
        Handles image being uploaded. Creates and store image thumbnail

        :param dataset_storage_identifier: Identifier of the dataset storage containing the dataset
        :param image_id: image ID
        :param data_binary_filename: uploaded binary filename
        """
        data_stream = ImageBinaryRepo(dataset_storage_identifier).get_by_filename(
            filename=data_binary_filename, binary_interpreter=StreamBinaryInterpreter()
        )
        try:
            data_stream.seek(0)
            pil_image = PILImage.open(data_stream)
            # Create a thumbnail for the image
            dst_file_name = Image.thumbnail_filename_by_image_id(image_id)
            with tempfile.NamedTemporaryFile(suffix=dst_file_name) as temp_file:
                MediaUploadedUseCase.crop_to_thumbnail(
                    pil_image=pil_image, target_width=DEFAULT_THUMBNAIL_SIZE, target_height=DEFAULT_THUMBNAIL_SIZE
                ).save(temp_file.name)
                ThumbnailBinaryRepo(dataset_storage_identifier).save(
                    data_source=temp_file.name, dst_file_name=dst_file_name
                )
            logger.debug(f"Image {image_id} has been successfully preprocessed")
        except Exception as ex:
            logger.error(f"Error occurred while preprocessing image {image_id}", exc_info=ex)
            raise RuntimeError("Failed to preprocess image file") from ex

    @staticmethod
    def crop_to_thumbnail(pil_image: PILImage.Image, target_height: int, target_width: int) -> PILImage.Image:
        """
        Crop an image to a thumbnail. The image is first scaled according to the side with the least amount of
        rescaling, and then the other side is cropped. In this way, a maximal portion of the image is visible in the
        thumbnail.

        :param pil_image: image to generate thumbnail for
        :param target_height: target height to crop the thumbnail to
        :param target_width: target width to crop the thumbnail to
        """
        scale_width = target_width / pil_image.width
        scale_height = target_height / pil_image.height
        scaling_factor = max(scale_width, scale_height)
        resized_image = pil_image.resize(
            (int(pil_image.width * scaling_factor), int(pil_image.height * scaling_factor))
        )
        # cropping
        x1 = (resized_image.width - target_width) / 2
        x2 = x1 + target_width
        y1 = (resized_image.height - target_height) / 2
        y2 = y1 + target_height
        x1 = round(max(x1, 0))
        x2 = round(min(x2, resized_image.width))
        y1 = round(max(y1, 0))
        y2 = round(min(y2, resized_image.height))
        return resized_image.crop((x1, y1, x2, y2))

    @staticmethod
    def on_video_uploaded(
        dataset_storage_identifier: DatasetStorageIdentifier,
        video_id: ID,
        data_binary_filename: str,
    ) -> None:
        """
        Handles video being uploaded. Creates and store video thumbnail, generates thumbnail video

        :param dataset_storage_identifier: Identifier of the dataset storage containing the dataset
        :param video_id: video ID
        :param data_binary_filename: uploaded binary filename
        """
        try:
            video_binary_repo = VideoBinaryRepo(dataset_storage_identifier)
            thumbnail_binary_repo = ThumbnailBinaryRepo(dataset_storage_identifier)
            url = video_binary_repo.get_path_or_presigned_url(filename=data_binary_filename)
            video_information = VideoDecoder.get_video_information(url)
            frame_index = video_information.total_frames // 2
            frame_numpy = VideoFrameReader.get_frame_numpy(
                file_location_getter=lambda: url,
                frame_index=frame_index,
            )
            cropped_numpy = Media2DFactory.crop_to_thumbnail(
                media_numpy=frame_numpy,
                target_height=DEFAULT_THUMBNAIL_SIZE,
                target_width=DEFAULT_THUMBNAIL_SIZE,
            )
            Media2DFactory.create_and_save_media_thumbnail(
                dataset_storage_identifier=dataset_storage_identifier,
                media_numpy=cropped_numpy,
                thumbnail_binary_filename=Video.thumbnail_filename_by_video_id(video_id),
            )

            with TemporaryDirectory() as tmp_directory:
                tmp_thumbnail_video = os.path.join(tmp_directory, data_binary_filename)
                logger.debug(f"Writing thumbnail video to {tmp_thumbnail_video}")

                generate_thumbnail_video(
                    data_binary_url=url,
                    thumbnail_video_path=tmp_thumbnail_video,
                    video_width=video_information.width,
                    video_height=video_information.height,
                    default_thumbnail_size=DEFAULT_THUMBNAIL_SIZE,
                )
                thumbnail_binary_repo.save(
                    data_source=tmp_thumbnail_video,
                    dst_file_name=Video.thumbnail_video_filename_by_video_id(video_id),
                )
            logger.debug(f"Video {video_id} has been successfully preprocessed")
        except Exception as ex:
            logger.error(f"Error occurred while preprocessing video {video_id}", exc_info=ex)
            raise RuntimeError("Failed to preprocess video file") from ex

    @staticmethod
    def publish_media_preprocessing_event(
        dataset_storage_identifier: DatasetStorageIdentifier,
        media_id: ID,
        media_type: str,
        event: str,
        preprocessing: dict | None = None,
    ) -> None:
        body: dict[str, Any] = {
            "project_id": str(dataset_storage_identifier.project_id),
            "dataset_storage_id": str(dataset_storage_identifier.dataset_storage_id),
            "media_id": str(media_id),
            "media_type": media_type,
            "event": event,
        }
        if preprocessing is not None:
            body["preprocessing"] = preprocessing
        publish_event(
            topic="media_preprocessing",
            body=body,
            key=str(media_id).encode(),
            headers_getter=lambda: CTX_SESSION_VAR.get().as_list_bytes(),
        )
