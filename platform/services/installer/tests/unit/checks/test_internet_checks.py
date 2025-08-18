# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import pytest
import requests

from checks.errors import CheckSkipped
from checks.internet import check_internet_connection
from configuration_models.install_config import InstallationConfig


def test_check_internet_connection(mocker):
    head_mock = mocker.patch("checks.internet.requests.head")
    config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    check_internet_connection(config=config_mock)

    head_mock.assert_called_once_with("http://example.com", allow_redirects=True, timeout=10)
    head_mock.return_value.raise_for_status.assert_called_once()
    assert config_mock.internet_access.value is True


def test_check_internet_connection_with_exception(mocker):
    head_mock = mocker.patch("checks.internet.requests.head")
    head_mock.side_effect = requests.Timeout()
    config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)

    with pytest.raises(CheckSkipped):
        check_internet_connection(config=config_mock)

    assert config_mock.internet_access.value is False
    head_mock.assert_called_once_with("http://example.com", allow_redirects=True, timeout=10)
    head_mock.return_value.raise_for_status.assert_not_called()


def test_check_internet_connection_with_error_response(mocker):
    head_mock = mocker.patch("checks.internet.requests.head")
    head_mock.return_value.raise_for_status.side_effect = requests.HTTPError()
    config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)

    with pytest.raises(CheckSkipped):
        check_internet_connection(config=config_mock)

    assert config_mock.internet_access.value is False
    head_mock.assert_called_once_with("http://example.com", allow_redirects=True, timeout=10)
    head_mock.return_value.raise_for_status.assert_called_once()
