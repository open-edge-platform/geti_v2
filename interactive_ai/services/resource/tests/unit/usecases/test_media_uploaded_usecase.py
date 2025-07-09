# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from unittest.mock import ANY, MagicMock, call, patch

import pytest

from usecases.media_uploaded_usecase import MediaUploadedUseCase

from geti_types import ID
from iai_core.entities.dataset_storage import DatasetStorageIdentifier
from iai_core.repos.storage.binary_repos import ImageBinaryRepo, ThumbnailBinaryRepo, VideoBinaryRepo
from iai_core.utils.media_factory import Media2DFactory
from media_utils import VideoDecoder, VideoFrameReader, VideoInformation

DATASET_STORAGE_ID: DatasetStorageIdentifier = DatasetStorageIdentifier(
    workspace_id=ID("63b183d00000000000000001"),
    project_id=ID("project_id"),
    dataset_storage_id=ID("dataset_storage_id"),
)


def mock_init(self, *args, **kwargs) -> None:
    return None


class TestMediaUploadedUseCase:
    @pytest.mark.parametrize("media_type", ["IMAGE", "VIDEO"])
    def test_on_media_uploaded_success(self, media_type) -> None:
        # Arrange

        # Act
        with (
            patch.object(
                MediaUploadedUseCase, "publish_media_preprocessing_event"
            ) as mock_publish_media_preprocessing_event,
            patch.object(MediaUploadedUseCase, "on_image_uploaded") as mock_on_image_uploaded,
            patch.object(MediaUploadedUseCase, "on_video_uploaded") as mock_on_video_uploaded,
        ):
            MediaUploadedUseCase.on_media_uploaded(
                dataset_storage_identifier=DATASET_STORAGE_ID,
                media_type=media_type,
                media_id=ID("media_id"),
                data_binary_filename="data_binary_filename",
            )

        # Assert
        assert mock_publish_media_preprocessing_event.call_count == 2
        mock_publish_media_preprocessing_event.assert_has_calls(
            [
                call(
                    dataset_storage_identifier=DATASET_STORAGE_ID,
                    media_id=ID("media_id"),
                    media_type=media_type,
                    event="MEDIA_PREPROCESSING_STARTED",
                ),
                call(
                    dataset_storage_identifier=DATASET_STORAGE_ID,
                    media_id=ID("media_id"),
                    media_type=media_type,
                    event="MEDIA_PREPROCESSING_FINISHED",
                    preprocessing={"success": True},
                ),
            ]
        )
        if media_type == "IMAGE":
            mock_on_image_uploaded.assert_called_once_with(
                dataset_storage_identifier=DATASET_STORAGE_ID,
                image_id=ID("media_id"),
                data_binary_filename="data_binary_filename",
            )
            mock_on_video_uploaded.assert_not_called()
        else:
            mock_on_image_uploaded.assert_not_called()
            mock_on_video_uploaded.assert_called_once_with(
                dataset_storage_identifier=DATASET_STORAGE_ID,
                video_id=ID("media_id"),
                data_binary_filename="data_binary_filename",
            )

    @pytest.mark.parametrize("media_type", ["IMAGE", "VIDEO"])
    def test_on_media_uploaded_failure(self, media_type) -> None:
        # Arrange

        # Act
        with (
            patch.object(
                MediaUploadedUseCase, "publish_media_preprocessing_event"
            ) as mock_publish_media_preprocessing_event,
            patch.object(
                MediaUploadedUseCase, "on_image_uploaded", side_effect=Exception("Preprocessing failed")
            ) as mock_on_image_uploaded,
            patch.object(
                MediaUploadedUseCase, "on_video_uploaded", side_effect=Exception("Preprocessing failed")
            ) as mock_on_video_uploaded,
        ):
            MediaUploadedUseCase.on_media_uploaded(
                dataset_storage_identifier=DATASET_STORAGE_ID,
                media_type=media_type,
                media_id=ID("media_id"),
                data_binary_filename="data_binary_filename",
            )

        # Assert
        assert mock_publish_media_preprocessing_event.call_count == 2
        mock_publish_media_preprocessing_event.assert_has_calls(
            [
                call(
                    dataset_storage_identifier=DATASET_STORAGE_ID,
                    media_id=ID("media_id"),
                    media_type=media_type,
                    event="MEDIA_PREPROCESSING_STARTED",
                ),
                call(
                    dataset_storage_identifier=DATASET_STORAGE_ID,
                    media_id=ID("media_id"),
                    media_type=media_type,
                    event="MEDIA_PREPROCESSING_FINISHED",
                    preprocessing={"success": False, "message": "Preprocessing failed"},
                ),
            ]
        )
        if media_type == "IMAGE":
            mock_on_image_uploaded.assert_called_once_with(
                dataset_storage_identifier=DATASET_STORAGE_ID,
                image_id=ID("media_id"),
                data_binary_filename="data_binary_filename",
            )
            mock_on_video_uploaded.assert_not_called()
        else:
            mock_on_image_uploaded.assert_not_called()
            mock_on_video_uploaded.assert_called_once_with(
                dataset_storage_identifier=DATASET_STORAGE_ID,
                video_id=ID("media_id"),
                data_binary_filename="data_binary_filename",
            )

    @patch("tempfile.NamedTemporaryFile")
    @patch("PIL.Image.open")
    @patch.object(ImageBinaryRepo, "__init__", new=mock_init)
    def test_on_image_uploaded(self, mock_image_open, mock_temp_file_context) -> None:
        # Arrange
        mock_temp_file = MagicMock()
        mock_temp_file.name = "/tmp/file.jpg"
        mock_temp_file_context.return_value.__enter__.return_value = mock_temp_file
        data_stream = MagicMock()

        resized_image = MagicMock()
        pil_image = MagicMock()
        pil_image.resize.return_value = resized_image
        mock_image_open.return_value = pil_image

        # Act
        with (
            patch.object(ImageBinaryRepo, "get_by_filename", return_value=data_stream) as mock_get_by_filename,
            patch.object(ThumbnailBinaryRepo, "save") as mock_save_thumbnail,
        ):
            MediaUploadedUseCase.on_image_uploaded(
                dataset_storage_identifier=DATASET_STORAGE_ID,
                image_id=ID("image_id"),
                data_binary_filename="data_binary_filename",
            )

        # Assert
        mock_get_by_filename.assert_called_once_with(filename="data_binary_filename", binary_interpreter=ANY)
        data_stream.seek.assert_called_once_with(0)
        mock_image_open.assert_called_once_with(data_stream)
        mock_temp_file_context.assert_called_once_with(suffix="image_id_thumbnail.jpg")
        pil_image.resize.assert_called_once_with((256, 256))
        resized_image.save.assert_called_once_with("/tmp/file.jpg")
        mock_save_thumbnail.assert_called_once_with(
            data_source="/tmp/file.jpg",
            dst_file_name="image_id_thumbnail.jpg",
        )

    @patch("usecases.media_uploaded_usecase.TemporaryDirectory")
    @patch.object(ThumbnailBinaryRepo, "__init__", new=mock_init)
    @patch.object(VideoBinaryRepo, "__init__", new=mock_init)
    def test_on_video_uploaded(self, mock_temporary_directory) -> None:
        # Arrange
        frame_numpy = MagicMock()
        cropped_numpy = MagicMock()
        video_information = VideoInformation(fps=30, width=200, height=100, total_frames=100)

        temp_dir = "temporary_path"
        temp_dir_context = MagicMock()
        temp_dir_context.__enter__.return_value = temp_dir
        mock_temporary_directory.return_value = temp_dir_context

        # Act
        with (
            patch.object(
                VideoBinaryRepo, "get_path_or_presigned_url", return_value="presigned_url"
            ) as mock_get_path_or_presigned_url,
            patch.object(
                VideoDecoder, "get_video_information", return_value=video_information
            ) as mock_get_video_information,
            patch.object(VideoFrameReader, "get_frame_numpy", return_value=frame_numpy) as mock_get_frame_numpy,
            patch.object(Media2DFactory, "crop_to_thumbnail", return_value=cropped_numpy) as mock_crop_to_thumbnail,
            patch.object(Media2DFactory, "create_and_save_media_thumbnail") as mock_create_and_save_media_thumbnail,
            patch(
                "usecases.media_uploaded_usecase.generate_thumbnail_video",
                return_value="thumbnail_video_path",
            ) as mock_generate_thumbnail_video,
            patch.object(ThumbnailBinaryRepo, "save") as mock_save,
        ):
            MediaUploadedUseCase.on_video_uploaded(
                dataset_storage_identifier=DATASET_STORAGE_ID,
                video_id=ID("video_id"),
                data_binary_filename="data_binary_filename",
            )

        # Assert
        mock_get_path_or_presigned_url.assert_called_once_with(filename="data_binary_filename")
        mock_get_video_information.assert_called_once_with("presigned_url")
        mock_get_frame_numpy.assert_called_once_with(file_location_getter=ANY, frame_index=50)
        mock_crop_to_thumbnail.assert_called_once_with(media_numpy=frame_numpy, target_height=256, target_width=256)
        mock_create_and_save_media_thumbnail.assert_called_once_with(
            dataset_storage_identifier=DATASET_STORAGE_ID,
            media_numpy=cropped_numpy,
            thumbnail_binary_filename="video_id_thumbnail.jpg",
        )
        mock_temporary_directory.assert_called_once_with()
        mock_generate_thumbnail_video.assert_called_once_with(
            data_binary_url="presigned_url",
            thumbnail_video_path="temporary_path/data_binary_filename",
            video_width=200,
            video_height=100,
            default_thumbnail_size=256,
        )
        mock_save.assert_called_once_with(
            data_source="temporary_path/data_binary_filename",
            dst_file_name="video_id_thumbnail.mp4",
        )
