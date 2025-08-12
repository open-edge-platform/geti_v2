# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import subprocess
from unittest.mock import MagicMock

import pytest

from configuration_models.install_config import InstallationConfig
from platform_stages.steps.deploy_pv import deploy_pv_chart
from platform_stages.steps.errors import PVInstallationError


@pytest.fixture
def mock_upsert_chart(mocker):
    mocker.patch("platform_utils.k8s.KubernetesConfigHandler")
    mocker.patch("builtins.open", MagicMock())
    mocker.patch("yaml.safe_load", MagicMock())
    mock_core_v1_api = mocker.patch("platform_utils.k8s.client.CoreV1Api")
    mock_core_v1_api.read_namespaced_endpoints.return_value = MagicMock
    mocker.patch("platform_utils.k8s.restart_deployment")


def test_deploy_pv_success(mocker, mock_upsert_chart):
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    mocker.patch("platform_utils.helm.subprocess_run")
    deploy_pv_chart(config=install_config_mock)


def test_deploy_pv_failed(mocker, mock_upsert_chart):
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    mocker.patch(
        "platform_utils.helm.subprocess_run", side_effect=subprocess.CalledProcessError(returncode=1, cmd="cmd")
    )
    with pytest.raises(PVInstallationError):
        deploy_pv_chart(config=install_config_mock)
