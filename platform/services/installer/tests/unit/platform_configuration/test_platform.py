# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from collections.abc import Sequence
from unittest.mock import MagicMock, Mock

import pytest
from kubernetes import client
from kubernetes.client import V1Deployment, V1DeploymentList, V1ObjectMeta
from urllib3.exceptions import MaxRetryError

from constants.platform import PLATFORM_NAMESPACE
from platform_configuration.errors import ConfigurationError
from platform_configuration.platform import is_grafana_installed

PATCHING_TARGET = "platform_configuration.platform"


def _get_fake_namespace_list(namespace_names: Sequence[str]) -> V1DeploymentList:
    """Creates a fake V1NamespaceList, based on the provided namespace names."""
    items = []

    for name in namespace_names:
        metadata = Mock(V1ObjectMeta)
        metadata.name = name
        namespace = Mock(V1Deployment)
        namespace.metadata = metadata

        items.append(namespace)

    deployment_list = Mock(V1DeploymentList)
    deployment_list.items = items

    return deployment_list


@pytest.mark.parametrize(
    "result_expected,deployment_names",
    (
        pytest.param(True, (f"{PLATFORM_NAMESPACE}-grafana", "default"), id="positive"),
        pytest.param(False, ("default", "bar"), id="negative"),
    ),
)
def test_is_grafana_installed(mocker, result_expected: bool, deployment_names: Sequence[str]):
    """Tests the is_grafana_installed function."""
    mock_config = mocker.patch(f"{PATCHING_TARGET}.KubernetesConfigHandler")

    namespace_list_mock = _get_fake_namespace_list(deployment_names)

    mock_api_client = MagicMock(client.ApiClient)
    mock_api_client_init_ret = MagicMock()
    mock_api_client_init_ret.__enter__.side_effect = [mock_api_client]
    mock_api_client_type = mocker.patch(f"{PATCHING_TARGET}.client.ApiClient")
    mock_api_client_type.side_effect = [mock_api_client_init_ret]

    mock_apps_v1_api = MagicMock(client.AppsV1Api)
    mock_apps_v1_api.list_namespaced_deployment.side_effect = [namespace_list_mock]
    mock_apps_v1_api_type = mocker.patch(f"{PATCHING_TARGET}.client.AppsV1Api")
    mock_apps_v1_api_type.side_effect = [mock_apps_v1_api]

    kubeconfig_path_mock = "path/kubeconfig"

    result_actual = is_grafana_installed(kubeconfig_path_mock)

    assert result_actual is result_expected

    mock_config.assert_called_once_with(kube_config=kubeconfig_path_mock)
    mock_apps_v1_api_type.assert_called_once_with(mock_api_client)
    mock_apps_v1_api.list_namespaced_deployment.assert_called_once_with(PLATFORM_NAMESPACE)


def test_is_grafana_installed_http_error(mocker):
    """Tests the is_grafana_installed function, against a K8s API connection/SSL error."""
    mocker.patch(f"{PATCHING_TARGET}.KubernetesConfigHandler")
    mocker.patch(f"{PATCHING_TARGET}.client.ApiClient")
    mock_apps_v1_api = MagicMock(client.AppsV1Api)
    mock_apps_v1_api.list_namespaced_deployment.side_effect = MaxRetryError(Mock(), Mock())
    mock_apps_v1_api_type = mocker.patch(f"{PATCHING_TARGET}.client.AppsV1Api")
    mock_apps_v1_api_type.side_effect = [mock_apps_v1_api]

    with pytest.raises(ConfigurationError):
        is_grafana_installed("some/kubeconfig")
