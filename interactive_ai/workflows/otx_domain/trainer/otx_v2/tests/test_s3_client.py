# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from datetime import timedelta
from pathlib import Path
from unittest.mock import ANY, MagicMock, patch

import pytest
from minio.error import S3Error
from s3_client import S3Client


def mock_client(self, *args, **kwargs) -> None:
    self.client = MagicMock()
    self.presigned_urls_client = MagicMock()
    return


@patch.object(S3Client, "__init__", new=mock_client)
def test_check_file_exists_true() -> None:
    # Arrange
    client = S3Client()

    # Act
    file_exists = client.check_file_exists(bucket_name="bucket_name", object_name=Path("object_name"))

    # Assert
    client.client.stat_object.assert_called_once_with(bucket_name="bucket_name", object_name="object_name")
    assert file_exists


@patch.object(S3Client, "__init__", new=mock_client)
def test_check_file_exists_false() -> None:
    # Arrange
    client = S3Client()
    client.client.stat_object.side_effect = S3Error(
        code=0, message="Test", resource="Test", request_id="Test", host_id="Test", response="Test"
    )

    # Act
    file_exists = client.check_file_exists(bucket_name="bucket_name", object_name=Path("object_name"))

    # Assert
    client.client.stat_object.assert_called_once_with(bucket_name="bucket_name", object_name="object_name")
    assert not file_exists


@patch.object(S3Client, "__init__", new=mock_client)
def test_upload_file_from_local_disk_exists() -> None:
    # Arrange
    client = S3Client()
    client.check_file_exists = MagicMock(return_value=True)

    # Act
    with pytest.raises(FileExistsError):
        client.upload_file_from_local_disk(
            bucket_name="bucket_name",
            relative_path=Path("relative_path"),
            local_file_path=Path("local_file_path"),
            overwrite=False,
        )

    # Assert
    client.check_file_exists.assert_called_once_with(bucket_name="bucket_name", object_name=Path("relative_path"))
    client.client.fput_object.assert_not_called()


@pytest.mark.parametrize("overwrite", [True, False])
@patch.object(S3Client, "__init__", new=mock_client)
def test_upload_file_from_local_disk_not_exists(overwrite) -> None:
    # Arrange
    client = S3Client()
    client.check_file_exists = MagicMock(return_value=False)

    # Act
    client.upload_file_from_local_disk(
        bucket_name="bucket_name",
        relative_path=Path("relative_path"),
        local_file_path=Path("local_file_path"),
        overwrite=overwrite,
    )

    # Assert
    if not overwrite:
        client.check_file_exists.assert_called_once_with(bucket_name="bucket_name", object_name=Path("relative_path"))
    client.client.fput_object.assert_called_once_with(
        bucket_name="bucket_name", object_name="relative_path", file_path=Path("local_file_path")
    )


@patch.object(S3Client, "__init__", new=mock_client)
def test_upload_file_from_bytes_exists() -> None:
    # Arrange
    client = S3Client()
    client.check_file_exists = MagicMock(return_value=True)

    # Act
    with pytest.raises(FileExistsError):
        client.upload_file_from_bytes(
            bucket_name="bucket_name",
            relative_path=Path("relative_path"),
            input_bytes=b"",
            overwrite=False,
        )

    # Assert
    client.check_file_exists.assert_called_once_with(bucket_name="bucket_name", object_name=Path("relative_path"))
    client.client.fput_object.assert_not_called()


@pytest.mark.parametrize("overwrite", [True, False])
@patch.object(S3Client, "__init__", new=mock_client)
def test_upload_file_from_bytes_not_exists(overwrite) -> None:
    # Arrange
    client = S3Client()
    client.check_file_exists = MagicMock(return_value=False)

    # Act
    client.upload_file_from_bytes(
        bucket_name="bucket_name",
        relative_path=Path("relative_path"),
        input_bytes=b"",
        overwrite=overwrite,
    )

    # Assert
    if not overwrite:
        client.check_file_exists.assert_called_once_with(bucket_name="bucket_name", object_name=Path("relative_path"))
    client.client.put_object.assert_called_once_with(
        bucket_name="bucket_name", object_name="relative_path", data=ANY, length=0
    )


@patch.object(S3Client, "__init__", new=mock_client)
def test_download_file() -> None:
    # Arrange
    client = S3Client()
    client.check_file_exists = MagicMock(return_value=False)

    # Act
    client.download_file(
        bucket_name="bucket_name",
        relative_path=Path("relative_path"),
        file_path=Path("file_path"),
    )

    # Assert
    client.client.fget_object.assert_called_once_with(
        bucket_name="bucket_name", object_name="relative_path", file_path=Path("file_path")
    )


@pytest.mark.parametrize("recursive", [True, False])
@patch.object(S3Client, "__init__", new=mock_client)
def test_list_files(recursive) -> None:
    # Arrange
    client = S3Client()
    client.client.list_objects.return_value = ["file1", "file2"]

    # Act
    files = client.list_files(
        bucket_name="bucket_name",
        relative_path=Path("relative_path"),
        recursive=recursive,
    )

    # Assert
    client.client.list_objects.assert_called_once_with(
        bucket_name="bucket_name", prefix="relative_path", recursive=recursive
    )
    assert files == ["file1", "file2"]


@pytest.mark.parametrize("recursive", [True, False])
@patch.object(S3Client, "__init__", new=mock_client)
def test_get_presigned_url(recursive) -> None:
    # Arrange
    client = S3Client()
    client.presigned_urls_client.presigned_get_object.return_value = "presigned_url"

    # Act
    presigned_url = client.get_presigned_url(
        bucket_name="bucket_name",
        relative_path=Path("relative_path"),
    )

    # Assert
    client.presigned_urls_client.presigned_get_object.assert_called_once_with(
        bucket_name="bucket_name", object_name="relative_path", expires=timedelta(minutes=15)
    )
    assert presigned_url == "presigned_url"
