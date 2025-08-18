# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from subprocess import CalledProcessError

import pytest

from checks.errors import CurlInternetCheckError, SnapCheckError
from checks.tools import (
    _check_curl_installed_via_snap,
    _check_if_curl_has_internet_access,
    _is_curl_installed,
    _is_snap_installed,
    check_tools_configuration,
)


@pytest.mark.parametrize(
    ("curl_fake_behavior", "expected_result"),
    [(CalledProcessError(cmd=["curl", "--version"], returncode=5), False), (b"curl 7.68.0", True)],
    ids=[
        "curl_command_not_found",
        "command_executed_properly",
    ],
)
def test_is_curl_installed(mocker, curl_fake_behavior, expected_result):
    check_output_mock = mocker.patch("checks.tools.subprocess.check_output")
    if isinstance(curl_fake_behavior, bytes):
        check_output_mock.return_value = curl_fake_behavior
    else:
        check_output_mock.side_effect = curl_fake_behavior

    result = _is_curl_installed()

    assert result == expected_result
    check_output_mock.assert_called_once_with(["curl", "--version"])


@pytest.mark.parametrize(
    ("snap_fake_behavior", "expected_result"),
    [(CalledProcessError(cmd=["snap", "--version"], returncode=5), False), (b"snap    2.59.5", True)],
    ids=[
        "snap_command_not_found",
        "command_executed_properly",
    ],
)
def test_is_snap_installed(mocker, snap_fake_behavior, expected_result):
    check_output_mock = mocker.patch("checks.tools.subprocess.check_output")
    if isinstance(snap_fake_behavior, bytes):
        check_output_mock.return_value = snap_fake_behavior
    else:
        check_output_mock.side_effect = snap_fake_behavior

    result = _is_snap_installed()

    assert result == expected_result
    check_output_mock.assert_called_once_with(["snap", "--version"])


@pytest.mark.parametrize(
    ("command_fake_behavior", "fail_expected"),
    [
        (CalledProcessError(cmd=["snap list | cut -d ' ' -f 1 | grep curl"], returncode=1), False),
        (b"curl", True),
    ],
    ids=[
        "curl_not_installed_by_snap",
        "curl_installed_by_snap",
    ],
)
def test_check_curl_installed_via_snap(mocker, command_fake_behavior, fail_expected):
    check_output_mock = mocker.patch("checks.tools.subprocess.check_output")
    if isinstance(command_fake_behavior, bytes):
        check_output_mock.return_value = command_fake_behavior
    else:
        check_output_mock.side_effect = command_fake_behavior

    if fail_expected:
        with pytest.raises(SnapCheckError):
            _check_curl_installed_via_snap()
    else:
        _check_curl_installed_via_snap()

    check_output_mock.assert_called_once_with("snap list | cut -d ' ' -f 1", stderr=-2, shell=True)


@pytest.mark.parametrize(
    ("is_curl_installed_behavior", "is_snap_installed_behavior"),
    [
        (True, True),
        (True, False),
        (False, False),
        (False, True),
    ],
    ids=[
        "curl_and_snap_installed",
        "only_curl_installed",
        "curl_not_installed",
        "curl_and_snap_not_installed",
    ],
)
def test_check_tools_configuration(mocker, is_curl_installed_behavior, is_snap_installed_behavior):
    is_curl_installed_mock = mocker.patch("checks.tools._is_curl_installed")
    is_curl_installed_mock.return_value = is_curl_installed_behavior
    is_snap_installed_mock = mocker.patch("checks.tools._is_snap_installed")
    is_snap_installed_mock.return_value = is_snap_installed_behavior
    check_curl_installed_via_snap_mock = mocker.patch("checks.tools._check_curl_installed_via_snap")

    check_tools_configuration()

    assert check_curl_installed_via_snap_mock.call_count == int(
        is_snap_installed_behavior and is_curl_installed_behavior
    )


@pytest.mark.parametrize(
    ("curl_internet_access_behavior", "fail_expected"),
    [
        (
            CalledProcessError(
                cmd=["curl", "--head", "--silent", "http://example.com", "--connect-timeout", "2"], returncode=5
            ),
            True,
        ),
        (b"Example Domain", False),
    ],
    ids=[
        "curl_request_timeout",
        "command_executed_properly",
    ],
)
def test_check_curl_internet_access(mocker, curl_internet_access_behavior, fail_expected):
    check_output_mock = mocker.patch("checks.tools.subprocess.check_output")
    if isinstance(curl_internet_access_behavior, bytes):
        check_output_mock.return_value = curl_internet_access_behavior
    else:
        check_output_mock.side_effect = curl_internet_access_behavior

    if fail_expected:
        with pytest.raises(CurlInternetCheckError):
            _check_if_curl_has_internet_access()
    else:
        _check_if_curl_has_internet_access()

    check_output_mock.assert_called_once_with(
        ["curl", "--head", "--silent", "http://example.com", "--connect-timeout", "5"]
    )
