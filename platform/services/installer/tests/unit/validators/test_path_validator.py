# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import pytest

from texts.validators import PathValidatorsTexts
from validators.path import ValidationError, get_path_permissions, is_data_folder_valid, is_path_valid


@pytest.mark.parametrize(
    ["path", "exists", "is_file", "listdir"],
    [
        ("/tmp", True, False, []),
        ("/etc", True, False, []),
        ("/data-xfs", True, False, []),
    ],
)
def test_is_path_valid(mocker, path: str, exists: bool, is_file: bool, listdir: list):
    mocker.patch("os.path.exists", return_value=exists)
    mocker.patch("os.path.isfile", return_value=is_file)
    mocker.patch("os.listdir", return_value=listdir)
    is_path_valid(path, is_remote_installation=False)


@pytest.mark.parametrize(
    ["path", "exists", "is_file", "listdir"],
    [
        ("notmp", False, False, []),
        ("", False, False, []),
        ("/path/leading/to/file", True, True, []),
        ("/path/leading/to/not/empty/dir", True, False, ["unwanted_file.tar.gz"]),
    ],
)
def test_is_path_invalid(mocker, path: str, exists: bool, is_file: bool, listdir: list):
    mocker.patch("os.path.exists", return_value=exists)
    mocker.patch("os.path.isfile", return_value=is_file)
    mocker.patch("os.listdir", return_value=listdir)
    with pytest.raises(ValidationError):
        is_path_valid(path, is_remote_installation=False)


def test_is_path_not_existing(mocker):
    """Test checks whether specified path is valid but does not exist (only for local installation)"""
    dummy_path = "/dummy"
    mocker.patch("os.path.exists", return_value=False)
    try:
        is_path_valid(path=dummy_path, is_remote_installation=False)
    except ValidationError as val_err:
        assert str(val_err) == PathValidatorsTexts.path_not_exists.format(path=dummy_path)


def test_is_path_valid_not_existing_for_remote(mocker):
    """Checks whether specified path is valid while its existence can't be verified due to remote installation"""
    mocker.patch("os.path.exists", return_value=False)
    dummy_path = "/definitelydoesnotexistpath123"
    is_path_valid(path=dummy_path, is_remote_installation=True)


def test_get_path_permissions(tmp_path):
    temp_file = tmp_path / "dummy_directory_path"
    temp_file.touch()
    temp_file.chmod(0o420)
    assert get_path_permissions(temp_file) == "420"
    temp_file.unlink()


def test_is_data_folder_valid(mocker):
    example_safe_permissions = "750"
    example_data_folder_path = "/example_very_safe_folder"
    mock_is_path_valid = mocker.patch("validators.path.is_path_valid")
    mock_get_path_permissions = mocker.patch(
        "validators.path.get_path_permissions", return_value=example_safe_permissions
    )
    is_data_folder_valid(path=example_data_folder_path, is_remote_installation=False)
    mock_is_path_valid.assert_called_once_with(path=example_data_folder_path, is_remote_installation=False)
    mock_get_path_permissions.assert_called_once_with(path=example_data_folder_path)


def test_is_data_folder_valid_unsafe_permissions(mocker):
    example_unsafe_permissions = "777"
    example_data_folder_path = "/example_unsafe_folder"
    mock_is_path_valid = mocker.patch("validators.path.is_path_valid")
    mock_get_path_permissions = mocker.patch(
        "validators.path.get_path_permissions", return_value=example_unsafe_permissions
    )
    with pytest.raises(ValidationError):
        is_data_folder_valid(path=example_data_folder_path, is_remote_installation=False)
    mock_is_path_valid.assert_called_once_with(path=example_data_folder_path, is_remote_installation=False)
    mock_get_path_permissions.assert_called_once_with(path=example_data_folder_path)


def test_is_data_folder_valid_path_invalid(mocker):
    example_safe_permissions = "750"
    example_data_folder_path = "/example_very_safe_folder"
    mock_is_path_valid = mocker.patch("validators.path.is_path_valid", side_effect=ValidationError)
    mock_get_path_permissions = mocker.patch(
        "validators.path.get_path_permissions", return_value=example_safe_permissions
    )
    with pytest.raises(ValidationError):
        is_data_folder_valid(path=example_data_folder_path, is_remote_installation=False)
    mock_is_path_valid.assert_called_once_with(path=example_data_folder_path, is_remote_installation=False)
    mock_get_path_permissions.call_count == 0
