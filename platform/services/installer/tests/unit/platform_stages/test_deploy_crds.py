# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import subprocess
from unittest.mock import MagicMock

import pytest

from configuration_models.install_config import InstallationConfig
from platform_stages.steps.deploy_crds import CRDsInstallationError, deploy_crds_chart


@pytest.fixture
def mock_upsert_chart(mocker):
    mocker.patch("platform_utils.k8s.KubernetesConfigHandler")
    mocker.patch("builtins.open", MagicMock())
    mocker.patch("yaml.safe_load", MagicMock())
    mock_core_v1_api = mocker.patch("platform_utils.k8s.client.CoreV1Api")
    mock_core_v1_api.read_namespaced_endpoints.return_value = MagicMock
    mocker.patch("platform_utils.k8s.restart_deployment")


def test_deploy_crds_chart_success(mocker, mock_upsert_chart):
    """
    Test that the function works correctly when upsert_chart does not raise an exception.
    """
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.lightweight_installer.value = False

    mocker.patch("platform_utils.helm.subprocess_run")

    deploy_crds_chart(config=install_config_mock, charts_dir="/fake/path")


def test_deploy_crds_chart_failure(mocker, mock_upsert_chart):
    """
    Test that the function raises CRDsInstallationError when upsert_chart raises ChartInstallationError
    """
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.lightweight_installer.value = False

    mocker.patch("tenacity.nap.time.sleep")
    mocker.patch(
        "platform_utils.helm.subprocess_run", side_effect=subprocess.CalledProcessError(returncode=1, cmd="cmd")
    )

    with pytest.raises(CRDsInstallationError):
        deploy_crds_chart(install_config_mock)


def test_deploy_crds_chart_partial_failure(mocker, mock_upsert_chart):
    """
    Test that the function raises CRDsInstallationError when upsert_chart raises ChartInstallationError for one chart.
    """

    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.lightweight_installer.value = False

    mocker.patch(
        "platform_utils.helm.subprocess_run", side_effect=subprocess.CalledProcessError(returncode=1, cmd="cmd")
    )
    mocker.patch("tenacity.nap.time.sleep")

    with pytest.raises(CRDsInstallationError):
        deploy_crds_chart(config=install_config_mock, charts_dir="/fake/path")
