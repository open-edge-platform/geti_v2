# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import subprocess
from unittest.mock import MagicMock, mock_open

import pytest

from configuration_models.install_config import InstallationConfig
from platform_stages.steps.deploy_cert_manager_istio_csr import deploy_cert_manager_istio_csr_chart
from platform_stages.steps.errors import CertManagerIstioCSRInstallationError


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


def test_deploy_cert_manager_success(mocker, mock_upsert_chart, mock_save_template):
    mocker.patch("platform_utils.helm.subprocess_run")
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    deploy_cert_manager_istio_csr_chart(install_config_mock)


def test_deploy_cert_manager_failed(mocker, mock_upsert_chart, mock_save_template):
    mocker.patch(
        "platform_utils.helm.subprocess_run", side_effect=subprocess.CalledProcessError(returncode=1, cmd="cmd")
    )
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    with pytest.raises(CertManagerIstioCSRInstallationError):
        deploy_cert_manager_istio_csr_chart(install_config_mock)
