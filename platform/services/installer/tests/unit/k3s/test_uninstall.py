# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import io
import subprocess
import sys

import pytest
from kubernetes.client.rest import ApiException
from urllib3.exceptions import HTTPError

# noinspection PyProtectedMember
from k3s.uninstall import K3SUninstallationError, UninstallCmdTexts, _run_k3s_uninstaller, uninstall_k3s

FAKE_LOGS_DIR = "/fake/logs/dir"


@pytest.fixture
def get_data_folder_location_mock(mocker):
    return mocker.patch("k3s.uninstall._get_data_folder_location")


@pytest.fixture
def run_k3s_uninstaller_mock(mocker):
    return mocker.patch("k3s.uninstall._run_k3s_uninstaller")


@pytest.fixture
def remove_platform_data_mock(mocker):
    return mocker.patch("k3s.uninstall._remove_platform_data")


def test_uninstall_k3s(run_k3s_uninstaller_mock, remove_platform_data_mock, get_data_folder_location_mock):
    uninstall_k3s(delete_data=True, logs_file_path=FAKE_LOGS_DIR)
    assert get_data_folder_location_mock.call_count == 1
    assert run_k3s_uninstaller_mock.call_count == 1
    assert remove_platform_data_mock.call_count == 1


def test_uninstall_k3s_process_error(
    run_k3s_uninstaller_mock, remove_platform_data_mock, get_data_folder_location_mock
):
    run_k3s_uninstaller_mock.side_effect = subprocess.CalledProcessError(returncode=22, cmd="fake cmd")
    with pytest.raises(K3SUninstallationError):
        uninstall_k3s(delete_data=True, logs_file_path=FAKE_LOGS_DIR)
    assert run_k3s_uninstaller_mock.call_count == 1
    assert get_data_folder_location_mock.call_count == 1
    assert remove_platform_data_mock.call_count == 0


def test_uninstall_k3s_script_not_found(
    run_k3s_uninstaller_mock, remove_platform_data_mock, get_data_folder_location_mock
):
    run_k3s_uninstaller_mock.side_effect = FileNotFoundError
    with pytest.raises(K3SUninstallationError):
        uninstall_k3s(delete_data=True, logs_file_path=FAKE_LOGS_DIR)
    assert run_k3s_uninstaller_mock.call_count == 1
    assert get_data_folder_location_mock.call_count == 1
    assert remove_platform_data_mock.call_count == 0


def test_uninstall_k3s_remove_platform_data_nor_dir_nor_file(
    run_k3s_uninstaller_mock, remove_platform_data_mock, get_data_folder_location_mock
):
    remove_platform_data_mock.side_effect = ValueError
    captured_output = io.StringIO()
    sys.stdout = captured_output
    uninstall_k3s(delete_data=True, logs_file_path=FAKE_LOGS_DIR)
    sys.stdout = sys.__stdout__
    assert run_k3s_uninstaller_mock.call_count == 1
    assert get_data_folder_location_mock.call_count == 1
    assert remove_platform_data_mock.call_count == 1
    assert captured_output.getvalue() == f"{UninstallCmdTexts.data_folder_removal_failed}\n"


def test_uninstall_k3s_get_data_folder_failed(
    run_k3s_uninstaller_mock, remove_platform_data_mock, get_data_folder_location_mock
):
    get_data_folder_location_mock.side_effect = ApiException
    captured_output = io.StringIO()
    sys.stdout = captured_output
    uninstall_k3s(delete_data=True, logs_file_path=FAKE_LOGS_DIR)
    sys.stdout = sys.__stdout__
    assert run_k3s_uninstaller_mock.call_count == 1
    assert get_data_folder_location_mock.call_count == 1
    assert remove_platform_data_mock.call_count == 0
    assert (
        captured_output.getvalue()
        == f"{UninstallCmdTexts.data_folder_get_failed}\n{UninstallCmdTexts.data_folder_removal_failed}\n"
    )


def test_uninstall_k3s_corrupted_deployment_failed(
    run_k3s_uninstaller_mock, remove_platform_data_mock, get_data_folder_location_mock
):
    get_data_folder_location_mock.side_effect = HTTPError
    captured_output = io.StringIO()
    sys.stdout = captured_output
    uninstall_k3s(delete_data=True, logs_file_path=FAKE_LOGS_DIR)
    sys.stdout = sys.__stdout__
    assert run_k3s_uninstaller_mock.call_count == 1
    assert get_data_folder_location_mock.call_count == 1
    assert remove_platform_data_mock.call_count == 0
    assert (
        captured_output.getvalue()
        == f"{UninstallCmdTexts.corrupted_deployment_failed}\n{UninstallCmdTexts.data_folder_removal_failed}\n"
    )


def test_run_k3s_uninstaller(mocker):
    open_mock = mocker.patch("builtins.open")
    subprocess_run_mock = mocker.patch("k3s.uninstall.subprocess_run")
    fake_script_path = "/fake/script/path"
    _run_k3s_uninstaller(FAKE_LOGS_DIR, fake_script_path)

    assert open_mock.call_count == 1
    assert subprocess_run_mock.call_count == 1
    assert subprocess_run_mock.call_args[0][0] == fake_script_path
