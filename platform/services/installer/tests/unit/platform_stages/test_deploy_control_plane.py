# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import subprocess
from unittest.mock import MagicMock, mock_open

import pytest

from configuration_models.install_config import InstallationConfig
from configuration_models.upgrade_config import UpgradeConfig
from platform_stages.steps.deploy_control_plane import deploy_control_plane_chart
from platform_stages.steps.errors import ControlPlaneInstallationError


@pytest.fixture
def mock_save_template(mocker):
    mocker.patch("platform_utils.helm.Environment")
    mock_data = "mock file content"
    mocker.patch("builtins.open", mock_open(read_data=mock_data))


@pytest.fixture
def mock_upsert_chart(mocker):
    mocker.patch("platform_utils.k8s.KubernetesConfigHandler")
    mock_core_v1_api = mocker.patch("platform_utils.k8s.client.CoreV1Api")
    mock_core_v1_api.read_namespaced_endpoints.return_value = MagicMock
    mocker.patch("platform_utils.k8s.restart_deployment")


def test_deploy_control_plane_success(mocker, mock_upsert_chart, mock_save_template):
    product_build_mock = "2.6.0-rc1-20220630112805"
    mocker.patch("platform_stages.steps.deploy_control_plane.get_target_product_build", return_value=product_build_mock)
    mocker.patch("platform_utils.helm.subprocess_run")
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    deploy_control_plane_chart(config=install_config_mock)


def test_deploy_control_plane_failed(mocker, mock_upsert_chart, mock_save_template):
    product_build_mock = "2.6.0-rc1-20220630112805"
    mocker.patch("platform_stages.steps.deploy_control_plane.get_target_product_build", return_value=product_build_mock)
    mocker.patch(
        "platform_utils.helm.subprocess_run", side_effect=subprocess.CalledProcessError(returncode=1, cmd="cmd")
    )
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    with pytest.raises(ControlPlaneInstallationError):
        deploy_control_plane_chart(config=install_config_mock)


def test_deploy_control_plane_upgrade_success(mocker, mock_upsert_chart, mock_save_template):
    product_build_mock = "2.6.0-rc1-20220630112805"
    smtp_secret_mock = MagicMock()
    smtp_secret_mock.data = {"smtp_host": b"MTAuNTUuMjUyLjMz", "smtp_port": b"MzAwMTA="}

    mocker.patch("platform_stages.steps.deploy_control_plane.get_target_product_build", return_value=product_build_mock)
    mocker.patch("platform_stages.steps.deploy_control_plane.get_secret_from_namespace", return_value=smtp_secret_mock)
    mocker.patch("platform_utils.helm.subprocess_run")
    upgrade_config_mock = UpgradeConfig(interactive_mode=False, install_telemetry_stack=False)
    deploy_control_plane_chart(config=upgrade_config_mock)


def test_deploy_control_plane_upgrade_failed(mocker, mock_upsert_chart, mock_save_template):
    product_build_mock = "2.6.0-rc1-20220630112805"
    smtp_secret_mock = MagicMock()
    smtp_secret_mock.data = {"smtp_host": b"MTAuNTUuMjUyLjMz", "smtp_port": b"MzAwMTA="}

    mocker.patch("platform_stages.steps.deploy_control_plane.get_target_product_build", return_value=product_build_mock)
    mocker.patch("platform_stages.steps.deploy_control_plane.get_secret_from_namespace", return_value=smtp_secret_mock)
    mocker.patch(
        "platform_utils.helm.subprocess_run", side_effect=subprocess.CalledProcessError(returncode=1, cmd="cmd")
    )
    upgrade_config_mock = UpgradeConfig(interactive_mode=False, install_telemetry_stack=False)
    with pytest.raises(ControlPlaneInstallationError):
        deploy_control_plane_chart(config=upgrade_config_mock)
