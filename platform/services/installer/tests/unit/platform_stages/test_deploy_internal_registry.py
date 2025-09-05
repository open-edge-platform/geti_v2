# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import subprocess
from unittest.mock import MagicMock, mock_open, patch

import pytest

from configuration_models.install_config import InstallationConfig
from platform_stages.steps.deploy_internal_registry import (
    create_certificates,
    deploy_internal_registry,
    update_configuration,
)
from platform_stages.steps.errors import (
    ContainerdCertificateCreationError,
    ContainerdConfigurationError,
    InternalRegistryInstallationError,
)

FAKE_DATA_FOLDER = "/etc/fake"


@pytest.fixture
def mock_save_template(mocker):
    mocker.patch("platform_utils.helm.Environment")
    mock_data = "mock file content"
    mocker.patch("builtins.open", mock_open(read_data=mock_data))


@pytest.fixture
def mock_upsert_chart(mocker):
    mocker.patch("platform_utils.k8s.KubernetesConfigHandler")
    mocker.patch("builtins.open", MagicMock())
    mocker.patch("yaml.safe_load", MagicMock())
    mock_core_v1_api = mocker.patch("platform_utils.k8s.client.CoreV1Api")
    mock_core_v1_api.read_namespaced_endpoints.return_value = MagicMock
    mocker.patch("platform_utils.k8s.restart_deployment")


@pytest.fixture
def apps_api_mock(mocker):
    mocker.patch("platform_utils.k8s.KubernetesConfigHandler")
    mocker.patch("platform_utils.k8s.client", return_value=MagicMock())
    apps_api_mock = mocker.patch("platform_utils.k8s.client.AppsV1Api").return_value
    return apps_api_mock


def test_update_configuration(mocker):
    expected_content = "/etc/containerd/certs.d"
    mocker.patch("platform_stages.steps.deploy_internal_registry.shutil.copyfile")
    mock_data = "/var/lib/rancher/k3s/agent/etc/containerd/certs.d"
    with patch("builtins.open", mock_open(read_data=mock_data)) as mock_file:
        update_configuration()

        # Check that the file was opened correctly for reading
        mock_file().read.assert_called_once()

        # Check that the file was opened correctly for writing
        mock_file().write.assert_called_once_with(expected_content)


def test_not_update_configuration(mocker):
    mocker.patch("platform_stages.steps.deploy_internal_registry.shutil.copyfile")
    mock_data = "/var/lib/rancher/k3s/agent/etc/containerd/certs"
    with patch("builtins.open", mock_open(read_data=mock_data)) as mock_file:
        update_configuration()

        # Check that the file was opened correctly for reading
        mock_file().read.assert_called_once()

        # Check that the file was not opened for writing
        assert mock_file().write.call_count == 0


def test_create_certificates(mocker):
    mocker.patch("platform_stages.steps.deploy_internal_registry.pathlib.Path.unlink")
    mocker.patch("platform_stages.steps.deploy_internal_registry.subprocess_run")
    mock_tls_crt = "mocked_tls_crt"
    mock_tls_key = "mocked_tls_key"
    mock_get_secret = MagicMock(data={"tls.crt": mock_tls_crt, "tls.key": mock_tls_key})
    mocker.patch(
        "platform_stages.steps.deploy_internal_registry.get_secret_from_namespace", return_value=mock_get_secret
    )
    mocker.patch("platform_stages.steps.deploy_internal_registry.pathlib.Path.mkdir")
    mocker.patch("platform_stages.steps.deploy_internal_registry.decode_string_b64", side_effect=lambda x: x)
    with patch("builtins.open", mock_open()) as mock_file:
        create_certificates(data_folder=FAKE_DATA_FOLDER)

        assert mock_file().write.call_count == 2


def test_deploy_internal_registry_success(mocker, mock_upsert_chart, mock_save_template, apps_api_mock):
    # chart installation
    mock_chart = mocker.patch("platform_utils.helm.subprocess_run")
    # create certificates
    mock_certs = mocker.patch("platform_stages.steps.deploy_internal_registry.create_certificates")
    # update containerd config
    mock_conf = mocker.patch("platform_stages.steps.deploy_internal_registry.update_configuration")
    # restart k3s
    mock_k3s = mocker.patch("platform_stages.steps.deploy_internal_registry.subprocess_run")

    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.lightweight_installer.value = False

    deploy_internal_registry(install_config_mock)

    assert mock_chart.call_count == 1
    assert mock_certs.call_count == 1
    assert mock_conf.call_count == 1
    assert mock_k3s.call_count == 1
    assert apps_api_mock.patch_namespaced_deployment.call_count == 1


def test_deploy_internal_registry_failed(mocker, mock_upsert_chart, mock_save_template):
    mocker.patch(
        "platform_utils.helm.subprocess_run", side_effect=subprocess.CalledProcessError(returncode=1, cmd="cmd")
    )
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.lightweight_installer.value = False
    mocker.patch("tenacity.nap.time.sleep")
    with pytest.raises(InternalRegistryInstallationError):
        deploy_internal_registry(install_config_mock)


def test_deploy_internal_registry_failed_containerd_config(mocker, mock_upsert_chart, mock_save_template):
    mocker.patch("platform_utils.helm.subprocess_run")
    mocker.patch("platform_stages.steps.deploy_internal_registry.update_configuration", side_effect=Exception)
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.lightweight_installer.value = False
    with pytest.raises(ContainerdConfigurationError):
        deploy_internal_registry(install_config_mock)


def test_deploy_internal_registry_failed_create_certs(mocker, mock_upsert_chart, mock_save_template):
    mocker.patch("platform_utils.helm.subprocess_run")
    mocker.patch("platform_stages.steps.deploy_internal_registry.update_configuration")
    mocker.patch("platform_stages.steps.deploy_internal_registry.create_certificates", side_effect=Exception)
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.lightweight_installer.value = False
    with pytest.raises(ContainerdCertificateCreationError):
        deploy_internal_registry(install_config_mock)
