# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import json
import os
import shutil
import tempfile
from unittest.mock import Mock, mock_open, patch
from uuid import UUID, uuid4

import mongomock
import pytest
from bson import ObjectId
from bson.binary import UUID_SUBTYPE, Binary, UuidRepresentation
from pymongo import MongoClient
from pymongo.database import Database

from migration.scripts.convert_vfr_videos_to_cfr import ConvertVFRVideosToCFR
from migration.utils.connection import MinioStorageClient


@pytest.fixture
def fxt_organization_id():
    yield uuid4()


@pytest.fixture
def fxt_workspace_id():
    yield uuid4()


@pytest.fixture
def fxt_project_id():
    yield ObjectId()


@pytest.fixture
def fxt_dataset_storage_id():
    yield ObjectId()


@pytest.fixture
def fxt_vfr_video_id():
    yield ObjectId()


@pytest.fixture
def fxt_cfr_video_id():
    yield ObjectId()


@pytest.fixture
def fxt_videos_before_upgrade(
    fxt_vfr_video_id, fxt_cfr_video_id, fxt_dataset_storage_id, fxt_organization_id, fxt_workspace_id, fxt_project_id
):
    """
    List of documents present in the database before upgrade - mix of VFR and CFR videos
    """
    yield [
        {
            "_id": fxt_vfr_video_id,
            "organization_id": fxt_organization_id,
            "workspace_id": fxt_workspace_id,
            "project_id": fxt_project_id,
            "dataset_storage_id": fxt_dataset_storage_id,
            "extension": "mp4",
            "fps": 30.0,
        },
        {
            "_id": fxt_cfr_video_id,
            "organization_id": fxt_organization_id,
            "workspace_id": fxt_workspace_id,
            "project_id": fxt_project_id,
            "dataset_storage_id": fxt_dataset_storage_id,
            "extension": "avi",
            "fps": 25.0,
        },
    ]


@pytest.fixture
def fxt_ds_storage_collection(fxt_dataset_storage_id, fxt_project_id):
    """
    List of documents present in the dataset_storage collection
    """
    yield [
        {
            "_id": fxt_dataset_storage_id,
            "project_id": fxt_project_id,
        }
    ]


@pytest.fixture(autouse=True)
def fxt_mongo_uuid(monkeypatch):
    def side_effect_mongo_mock_from_uuid(uuid: UUID, uuid_representation=UuidRepresentation.STANDARD):
        """Override (Mock) the bson.binary.Binary.from_uuid function to work for mongomock"""
        if not isinstance(uuid, UUID):
            raise TypeError("uuid must be an instance of uuid.UUID")

        subtype = UUID_SUBTYPE
        payload = uuid.bytes

        return Binary(payload, subtype)

    with patch.object(Binary, "from_uuid", side_effect=side_effect_mongo_mock_from_uuid):
        yield


@pytest.fixture
def fxt_temp_video_file():
    """Create a temporary video file for testing"""
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as temp_file:
        temp_file.write(b"mock video content")
        temp_path = temp_file.name

    yield temp_path

    # Cleanup
    if os.path.exists(temp_path):
        os.unlink(temp_path)


@pytest.fixture
def fxt_temp_frames_dir():
    """Create a temporary directory with mock frame files"""
    temp_dir = tempfile.mkdtemp(prefix="test_frames_")

    # Create some mock frame files
    for i in range(5):
        frame_path = os.path.join(temp_dir, f"frame_{i:06d}.png")
        with open(frame_path, "wb") as f:
            f.write(b"mock frame content")

    yield temp_dir

    # Cleanup
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)


class TestConvertVFRVideosToCFR:
    """Test suite for ConvertVFRVideosToCFR migration script"""

    def test_upgrade_project_with_vfr_videos(
        self,
        fxt_organization_id,
        fxt_workspace_id,
        fxt_project_id,
        fxt_videos_before_upgrade,
        fxt_ds_storage_collection,
        fxt_temp_video_file,
    ) -> None:
        """Test upgrade_project method when VFR videos are present"""
        mock_db: Database = mongomock.MongoClient(uuidRepresentation="standard").db
        os.environ["S3_CREDENTIALS_PROVIDER"] = "aws"
        os.environ["FEATURE_FLAG_MIGRATE_VFR_TO_CFR_VIDEOS"] = "true"

        video_collection = mock_db.create_collection("video")
        video_collection.insert_many(fxt_videos_before_upgrade)

        ds_storage_collection = mock_db.create_collection("dataset_storage")
        ds_storage_collection.insert_many(fxt_ds_storage_collection)

        # Mock storage client
        mock_storage_client = Mock()
        mock_storage_client.presigned_get_object.return_value = "http://example.com/video.mp4"
        mock_storage_client.put_object.return_value = None

        with (
            patch.object(MongoClient, "get_database", return_value=mock_db),
            patch.object(MinioStorageClient, "authenticate_saas_client", return_value=mock_storage_client),
            patch.object(ConvertVFRVideosToCFR, "_is_variable_frame_rate", side_effect=[True, False]),
            patch.object(ConvertVFRVideosToCFR, "_get_video_fps", return_value=30.0),
            patch.object(ConvertVFRVideosToCFR, "_convert_vfr_to_cfr", return_value=fxt_temp_video_file),
            patch("builtins.open", mock_open(read_data=b"mock video content")),
            patch("os.path.getsize", return_value=1024),
            patch("os.unlink"),
        ):
            ConvertVFRVideosToCFR.upgrade_project(
                organization_id=str(fxt_organization_id),
                workspace_id=str(fxt_workspace_id),
                project_id=str(fxt_project_id),
            )

        # Verify that storage operations were called for VFR video only
        assert mock_storage_client.presigned_get_object.call_count == 2
        assert mock_storage_client.put_object.call_count == 1

    def test_upgrade_project_no_vfr_videos(
        self,
        fxt_organization_id,
        fxt_workspace_id,
        fxt_project_id,
        fxt_videos_before_upgrade,
        fxt_ds_storage_collection,
    ) -> None:
        """Test upgrade_project method when no VFR videos are present"""
        mock_db: Database = mongomock.MongoClient(uuidRepresentation="standard").db
        os.environ["S3_CREDENTIALS_PROVIDER"] = "aws"

        video_collection = mock_db.create_collection("video")
        video_collection.insert_many(fxt_videos_before_upgrade)

        ds_storage_collection = mock_db.create_collection("dataset_storage")
        ds_storage_collection.insert_many(fxt_ds_storage_collection)

        # Mock storage client
        mock_storage_client = Mock()
        mock_storage_client.presigned_get_object.return_value = "http://example.com/video.mp4"

        with (
            patch.object(MongoClient, "get_database", return_value=mock_db),
            patch.object(MinioStorageClient, "authenticate_saas_client", return_value=mock_storage_client),
            patch.object(ConvertVFRVideosToCFR, "_is_variable_frame_rate", return_value=False),
        ):
            ConvertVFRVideosToCFR.upgrade_project(
                organization_id=str(fxt_organization_id),
                workspace_id=str(fxt_workspace_id),
                project_id=str(fxt_project_id),
            )

        # Verify that no conversion operations were called
        assert mock_storage_client.put_object.call_count == 0

    def test_get_video_fps_success(self):
        """Test _get_video_fps method with successful ffprobe output"""
        mock_result = Mock()
        mock_result.stdout = json.dumps({"streams": [{"r_frame_rate": "30000/1001"}]})

        with patch("subprocess.run", return_value=mock_result):
            fps = ConvertVFRVideosToCFR._get_video_fps("test_video.mp4")
            assert abs(fps - 29.970029970029972) < 0.001

    def test_get_video_fps_with_simple_fraction(self):
        """Test _get_video_fps method with simple fraction"""
        mock_result = Mock()
        mock_result.stdout = json.dumps({"streams": [{"r_frame_rate": "30/1"}]})

        with patch("subprocess.run", return_value=mock_result):
            fps = ConvertVFRVideosToCFR._get_video_fps("test_video.mp4")
            assert fps == 30.0

    def test_get_video_fps_error_handling(self):
        """Test _get_video_fps method error handling"""
        with patch("subprocess.run", side_effect=Exception("FFprobe failed")):
            with pytest.raises(Exception, match="FFprobe failed"):
                ConvertVFRVideosToCFR._get_video_fps("test_video.mp4")

    def test_is_variable_frame_rate_true(self):
        """Test _is_variable_frame_rate method returning True for VFR video"""
        mock_r_frame_rate = Mock()
        mock_r_frame_rate.returncode = 0
        mock_r_frame_rate.stdout = "30000/1001"

        mock_avg_frame_rate = Mock()
        mock_avg_frame_rate.returncode = 0
        mock_avg_frame_rate.stdout = "25/1"

        with patch("subprocess.run", side_effect=[mock_r_frame_rate, mock_avg_frame_rate]):
            result = ConvertVFRVideosToCFR._is_variable_frame_rate("test_video.mp4")
            assert result is True

    def test_is_variable_frame_rate_false(self):
        """Test _is_variable_frame_rate method returning False for CFR video"""
        mock_r_frame_rate = Mock()
        mock_r_frame_rate.returncode = 0
        mock_r_frame_rate.stdout = "30/1"

        mock_avg_frame_rate = Mock()
        mock_avg_frame_rate.returncode = 0
        mock_avg_frame_rate.stdout = "30/1"

        with patch("subprocess.run", side_effect=[mock_r_frame_rate, mock_avg_frame_rate]):
            result = ConvertVFRVideosToCFR._is_variable_frame_rate("test_video.mp4")
            assert result is False

    def test_is_variable_frame_rate_ffprobe_error(self):
        """Test _is_variable_frame_rate method with ffprobe error"""
        mock_error_result = Mock()
        mock_error_result.returncode = 1

        with patch("subprocess.run", return_value=mock_error_result):
            result = ConvertVFRVideosToCFR._is_variable_frame_rate("test_video.mp4")
            assert result is False

    def test_convert_vfr_to_cfr_success(self, fxt_temp_frames_dir, fxt_temp_video_file):
        """Test _convert_vfr_to_cfr method successful conversion"""
        with (
            patch.object(ConvertVFRVideosToCFR, "_extract_all_frames", return_value=True),
            patch.object(ConvertVFRVideosToCFR, "_stitch_frames_to_cfr_video", return_value=True),
            patch("tempfile.mkdtemp", return_value=fxt_temp_frames_dir),
            patch("tempfile.mkstemp", return_value=(1, fxt_temp_video_file)),
            patch("os.close"),
            patch("shutil.rmtree"),
        ):
            result = ConvertVFRVideosToCFR._convert_vfr_to_cfr("input_video.mp4", 30.0)
            assert result == fxt_temp_video_file

    def test_convert_vfr_to_cfr_extract_failure(self, fxt_temp_frames_dir):
        """Test _convert_vfr_to_cfr method with frame extraction failure"""
        with (
            patch.object(ConvertVFRVideosToCFR, "_extract_all_frames", return_value=False),
            patch("tempfile.mkdtemp", return_value=fxt_temp_frames_dir),
            patch("tempfile.mkstemp", return_value=(1, "/tmp/test.mp4")),
            patch("os.close"),
            patch("shutil.rmtree"),
        ):
            result = ConvertVFRVideosToCFR._convert_vfr_to_cfr("input_video.mp4", 30.0)
            assert result is None

    def test_extract_all_frames_success(self, fxt_temp_frames_dir):
        """Test _extract_all_frames method successful extraction"""
        mock_process = Mock()
        mock_process.returncode = 0

        with (
            patch("subprocess.run", return_value=mock_process),
            patch("os.makedirs"),
            patch("os.listdir", return_value=["frame_000001.png", "frame_000002.png"]),
        ):
            result = ConvertVFRVideosToCFR._extract_all_frames("input_video.mp4", fxt_temp_frames_dir)
            assert result is True

    def test_stitch_frames_to_cfr_video_success(self, fxt_temp_frames_dir, fxt_temp_video_file):
        """Test _stitch_frames_to_cfr_video method successful stitching"""
        mock_process = Mock()
        mock_process.returncode = 0

        with (
            patch("subprocess.run", return_value=mock_process),
            patch("os.path.exists", return_value=True),
            patch("os.listdir", return_value=["frame_000001.png", "frame_000002.png"]),
        ):
            result = ConvertVFRVideosToCFR._stitch_frames_to_cfr_video(fxt_temp_frames_dir, fxt_temp_video_file, 30.0)
            assert result is True

    def test_stitch_frames_to_cfr_video_no_frames_dir(self):
        """Test _stitch_frames_to_cfr_video method with non-existent frames directory"""
        with patch("os.path.exists", return_value=False):
            result = ConvertVFRVideosToCFR._stitch_frames_to_cfr_video("/nonexistent/dir", "output.mp4", 30.0)
            assert result is False

    def test_stitch_frames_to_cfr_video_no_frames(self, fxt_temp_frames_dir, fxt_temp_video_file):
        """Test _stitch_frames_to_cfr_video method with no PNG frames"""
        with (
            patch("os.path.exists", return_value=True),
            patch("os.listdir", return_value=[]),
        ):
            result = ConvertVFRVideosToCFR._stitch_frames_to_cfr_video(fxt_temp_frames_dir, fxt_temp_video_file, 30.0)
            assert result is False

    def test_stitch_frames_to_cfr_video_ffmpeg_failure(self, fxt_temp_frames_dir, fxt_temp_video_file):
        """Test _stitch_frames_to_cfr_video method with ffmpeg failure"""
        mock_process = Mock()
        mock_process.returncode = 1
        mock_process.stderr = "FFmpeg stitching error"

        with (
            patch("subprocess.run", return_value=mock_process),
            patch("os.path.exists", return_value=True),
            patch("os.listdir", return_value=["frame_000001.png"]),
        ):
            result = ConvertVFRVideosToCFR._stitch_frames_to_cfr_video(fxt_temp_frames_dir, fxt_temp_video_file, 30.0)
            assert result is False

    def test_stitch_frames_to_cfr_video_timeout(self, fxt_temp_frames_dir, fxt_temp_video_file):
        """Test _stitch_frames_to_cfr_video method with timeout"""
        import subprocess

        with (
            patch("subprocess.run", side_effect=subprocess.TimeoutExpired("ffmpeg", 1200)),
            patch("os.path.exists", return_value=True),
            patch("os.listdir", return_value=["frame_000001.png"]),
        ):
            result = ConvertVFRVideosToCFR._stitch_frames_to_cfr_video(fxt_temp_frames_dir, fxt_temp_video_file, 30.0)
            assert result is False

    def test_upgrade_project_error_handling(
        self,
        fxt_organization_id,
        fxt_workspace_id,
        fxt_project_id,
        fxt_videos_before_upgrade,
        fxt_ds_storage_collection,
    ) -> None:
        """Test upgrade_project method error handling when video processing fails"""
        mock_db: Database = mongomock.MongoClient(uuidRepresentation="standard").db
        os.environ["S3_CREDENTIALS_PROVIDER"] = "aws"

        video_collection = mock_db.create_collection("video")
        video_collection.insert_many(fxt_videos_before_upgrade)

        ds_storage_collection = mock_db.create_collection("dataset_storage")
        ds_storage_collection.insert_many(fxt_ds_storage_collection)

        # Mock storage client
        mock_storage_client = Mock()
        mock_storage_client.presigned_get_object.side_effect = Exception("Storage error")

        with (
            patch.object(MongoClient, "get_database", return_value=mock_db),
            patch.object(MinioStorageClient, "authenticate_saas_client", return_value=mock_storage_client),
        ):
            # Should not raise exception, should continue processing
            ConvertVFRVideosToCFR.upgrade_project(
                organization_id=str(fxt_organization_id),
                workspace_id=str(fxt_workspace_id),
                project_id=str(fxt_project_id),
            )

    def test_downgrade_methods(self):
        """Test that downgrade methods exist and do nothing"""
        # These methods should exist but do nothing
        ConvertVFRVideosToCFR.downgrade_project("org", "workspace", "project")
        ConvertVFRVideosToCFR.downgrade_non_project_data()
        ConvertVFRVideosToCFR.upgrade_non_project_data()
        # No assertions needed - just verify they don't raise exceptions
