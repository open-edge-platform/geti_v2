# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE


from unittest.mock import MagicMock, patch

import cv2
import numpy as np
import pytest

from media_utils.video_decoder import VideoTTLCache, _clean_file_location, _VideoDecoderOpenCV


@pytest.fixture
def video_ttl_cache():
    return VideoTTLCache(maxsize=2, ttl=300)


class TestDecoder:
    def test_clean_file_location(self):
        presigned_url1 = "http://impt-seaweed-fs.impt:8333/videos/53e0c1c0fc131213aab78428.mp4?0987654321"
        presigned_url2 = "http://impt-seaweed-fs.impt:8333/videos/53e0c1c0fc131213aab78428.mp4?1234567890"

        cleaned_presigned_url1 = _clean_file_location(presigned_url1)
        cleaned_presigned_url2 = _clean_file_location(presigned_url2)

        assert cleaned_presigned_url1 == cleaned_presigned_url2

    @pytest.mark.parametrize("mock_release", [MagicMock(spec=cv2.VideoCapture)])
    def test_release_opencv_video_capture_on_removal(self, mock_release, video_ttl_cache):
        video_ttl_cache["video1"] = (mock_release, None)
        del video_ttl_cache["video1"]
        mock_release.release.assert_called_once()

    def test_decode_with_fps_millisecond_seeking(self):
        """Test that fps parameter triggers millisecond-based seeking"""
        # Arrange
        decoder = _VideoDecoderOpenCV()
        mock_video_reader = MagicMock(spec=cv2.VideoCapture)

        # Mock frame count check - return different values for different CAP_PROP calls
        def mock_get_side_effect(prop):
            if prop == cv2.CAP_PROP_FRAME_COUNT:
                return 100  # total frames
            return 0

        mock_video_reader.get.side_effect = mock_get_side_effect
        mock_video_reader.read.return_value = (True, np.zeros((480, 640, 3), dtype=np.uint8))

        file_location = "test_video.mp4"
        frame_index = 30
        fps = 25.0

        # Act & Assert
        with patch(
            "media_utils.video_decoder._VideoDecoderOpenCV._VideoDecoderOpenCV__video_reader_cache"
        ) as mock_cache:
            with patch("media_utils.video_decoder._VideoFrameCache") as mock_frame_cache:
                mock_frame_cache_instance = MagicMock()
                mock_frame_cache.return_value = mock_frame_cache_instance
                mock_frame_cache_instance.get_if_exists.return_value = None

                mock_cache.get_or_create.return_value = (mock_video_reader, MagicMock())

                result = decoder.decode(file_location, frame_index, fps)

                # Should use millisecond-based seeking when fps is provided
                expected_milliseconds = int((frame_index / fps) * 1000)  # (30/25)*1000 = 1200ms
                mock_video_reader.set.assert_called_with(cv2.CAP_PROP_POS_MSEC, expected_milliseconds)
                assert isinstance(result, np.ndarray)
