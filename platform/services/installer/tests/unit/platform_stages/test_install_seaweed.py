# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from unittest.mock import MagicMock, patch

import pytest

from configuration_models.install_config import InstallationConfig
from platform_stages.steps.deploy_seaweed_fs import deploy_seaweed_fs_chart
from platform_stages.steps.errors import ChartInstallationError, SeaweedFSInstallationError


@pytest.fixture
def core_api_mock():
    return MagicMock()


@pytest.fixture
def mock_product_build(mocker):
    mock_get_target_product_build = mocker.patch("platform_stages.steps.deploy_seaweed_fs.get_target_product_build")
    mock_get_target_product_build.return_value = "X.Y.Z"


def test_install_seaweed_fs_success(core_api_mock, mock_product_build):
    with patch("platform_stages.steps.deploy_seaweed_fs.os.path.join", return_value="mocked_path"):
        with patch("platform_stages.steps.deploy_seaweed_fs.pull_chart"):
            with patch("platform_stages.steps.deploy_seaweed_fs.upsert_chart"):
                with patch("platform_stages.steps.deploy_seaweed_fs.KubernetesConfigHandler"):
                    with patch("platform_stages.steps.deploy_seaweed_fs.ApiClient") as mock_api_client:
                        mock_api_client.return_value.__enter__.return_value = core_api_mock
                        mock_core_api = MagicMock()
                        core_api_mock.CoreV1Api.return_value = mock_core_api
                        mock_core_api.list_namespaced_pod.return_value = MagicMock(
                            items=[MagicMock(metadata=MagicMock(name="pod-name"))]
                        )
                        install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
                        with patch(
                            "platform_stages.steps.deploy_seaweed_fs.set_bucket_ttl"
                        ) as mock_set_ttl_for_buckets:
                            with patch("platform_stages.steps.deploy_seaweed_fs.save_jinja_template"):
                                deploy_seaweed_fs_chart(install_config_mock)
                                mock_set_ttl_for_buckets.assert_called_once()


def test_install_seaweed_fs_failure(mock_product_build):
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    with patch("platform_stages.steps.deploy_seaweed_fs.os.path.join", return_value="mocked_path"):
        with patch("platform_stages.steps.deploy_seaweed_fs.pull_chart"):
            with patch("platform_stages.steps.deploy_seaweed_fs.upsert_chart", side_effect=ChartInstallationError):
                with patch("platform_stages.steps.deploy_seaweed_fs.save_jinja_template"):
                    with pytest.raises(SeaweedFSInstallationError):
                        deploy_seaweed_fs_chart(install_config_mock)
