# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import os
from dataclasses import dataclass
from unittest.mock import MagicMock, patch

import pytest
from kubernetes.client import V1ConfigMap

from checks.errors import CheckError, CheckSkipped
from checks.platform import check_if_platform_installed, check_platform_version


@dataclass
class CheckPlatformVersionMocks:
    load_kube_config_mock: MagicMock
    read_namespaced_config_map_mock: MagicMock


@pytest.fixture
def mock_check_platform_version(mocker, platform_version_in_cm):
    load_kube_config_mock = mocker.patch("checks.platform.KubernetesConfigHandler")
    mocker.patch("kubernetes.client.ApiClient")
    fake_platform_configuration_cm = V1ConfigMap(data={"platformVersion": platform_version_in_cm})
    fake_core_v1_api_client = mocker.MagicMock()
    read_namespaced_config_map_mock = mocker.patch.object(fake_core_v1_api_client, "read_namespaced_config_map")
    read_namespaced_config_map_mock.return_value = fake_platform_configuration_cm
    mocker.patch("kubernetes.client.CoreV1Api", return_value=fake_core_v1_api_client)

    return CheckPlatformVersionMocks(load_kube_config_mock, read_namespaced_config_map_mock)


# noinspection PyTestParametrized
@pytest.mark.parametrize("platform_version_in_cm", ["2.0.0"])
def test_check_platform_version(mock_check_platform_version: CheckPlatformVersionMocks):
    check_platform_version("fake-path")

    assert mock_check_platform_version.load_kube_config_mock.call_count == 1
    assert mock_check_platform_version.read_namespaced_config_map_mock.call_count == 1


# noinspection PyTestParametrized
@pytest.mark.parametrize("platform_version_in_cm", ["1.0.0", "1.0.1", "1.2.0", "1.3.0", "1.8.0"])
def test_check_platform_version_incorrect_version(mock_check_platform_version: CheckPlatformVersionMocks):
    with pytest.raises(CheckError):
        check_platform_version("fake-path")


@patch.dict(os.environ, {"PLATFORM_VERSION_CHECK": "false"})
def test_check_platform_version_skip_check():
    with pytest.raises(CheckSkipped):
        check_platform_version("fake-path")


@dataclass
class CheckPlatformInstalledMocks:
    load_kube_config_mock: MagicMock
    read_namespaced_config_map_mock: MagicMock


@pytest.fixture
def mock_check_if_platform_installed(mocker, platform_version_in_cm):
    load_kube_config_mock = mocker.patch("kubernetes.config.load_kube_config")
    mocker.patch("kubernetes.client.ApiClient")
    fake_platform_configuration_cm = V1ConfigMap(data={"platformVersion": platform_version_in_cm})
    fake_core_v1_api_client = mocker.MagicMock()
    read_namespaced_config_map_mock = mocker.patch.object(fake_core_v1_api_client, "read_namespaced_config_map")
    read_namespaced_config_map_mock.return_value = fake_platform_configuration_cm
    mocker.patch("kubernetes.client.CoreV1Api", return_value=fake_core_v1_api_client)

    return CheckPlatformInstalledMocks(load_kube_config_mock, read_namespaced_config_map_mock)


# noinspection PyTestParametrized
@pytest.mark.parametrize("platform_version_in_cm", ["1.0.0"])
def test_check_if_platform_installed(mock_check_if_platform_installed: CheckPlatformInstalledMocks):
    with pytest.raises(CheckError):
        check_if_platform_installed("fake-path")

    assert mock_check_if_platform_installed.load_kube_config_mock.call_count == 1
    assert mock_check_if_platform_installed.read_namespaced_config_map_mock.call_count == 1


@patch.dict(os.environ, {"PLATFORM_VERSION_CHECK": "false"})
def test_mock_check_if_platform_installed_skip_check():
    with pytest.raises(CheckSkipped):
        check_if_platform_installed("fake-path")
