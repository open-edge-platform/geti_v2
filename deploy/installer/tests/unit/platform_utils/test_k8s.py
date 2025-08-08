# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from unittest.mock import MagicMock, patch

import pytest
from kubernetes.client import ApiException

from platform_utils.k8s import (
    create_namespace,
    disable_automount_service_account_token,
    ensure_endpoint,
    get_secret_from_namespace,
    restart_deployment,
)


@pytest.fixture
def core_api_mock(mocker):
    mocker.patch("platform_utils.k8s.KubernetesConfigHandler")
    mocker.patch("platform_utils.k8s.client", return_value=MagicMock())
    core_api_mock = mocker.patch("platform_utils.k8s.client.CoreV1Api").return_value
    return core_api_mock


@pytest.fixture
def restart_deployment_mock():
    with patch("platform_utils.k8s.restart_deployment") as mock:
        yield mock


@pytest.fixture
def logger_mock():
    with patch("platform_utils.k8s.logger") as mock:
        yield mock


def test_restart_deployment(mocker):
    patching_target = "platform_utils.k8s"
    mocker.patch(f"{patching_target}.KubernetesConfigHandler")

    apps_v1_api_client_mock = MagicMock()
    mocker.patch(f"{patching_target}.client.AppsV1Api", return_value=apps_v1_api_client_mock)

    restart_deployment("fake-name")

    assert apps_v1_api_client_mock.patch_namespaced_deployment.call_count == 1


# Test the decorator when the endpoint is ready
def test_ensure_endpoint_ready(core_api_mock, restart_deployment_mock, logger_mock):
    # Arrange
    mock_func = MagicMock()

    # Create a mock endpoint response
    mock_address = MagicMock(ip="123.123.123.123")
    mock_subset = MagicMock(addresses=[mock_address])
    mock_endpoint = MagicMock(subsets=[mock_subset])
    core_api_mock.read_namespaced_endpoints.return_value = mock_endpoint

    # Act
    decorated_func = ensure_endpoint()(mock_func)
    decorated_func()

    # Assert
    assert core_api_mock.read_namespaced_endpoints.call_count == 3
    restart_deployment_mock.assert_not_called()
    mock_func.assert_called_once()


# Test the decorator when the endpoint is not ready and needs to restart the deployment
def test_ensure_endpoint_not_ready(core_api_mock, restart_deployment_mock, logger_mock):
    # Arrange
    mock_func = MagicMock()

    # Create a mock endpoint response with no addresses
    mock_endpoint = MagicMock(subsets=[])
    core_api_mock.read_namespaced_endpoints.return_value = mock_endpoint

    # Act
    decorated_func = ensure_endpoint()(mock_func)
    decorated_func()

    # Assert
    assert core_api_mock.read_namespaced_endpoints.call_count == 3
    assert restart_deployment_mock.call_count == 3
    mock_func.assert_called_once()


# Test the decorator when the endpoint has not_ready_addresses and needs to restart the deployment
def test_ensure_endpoint_not_ready_addresses(core_api_mock, restart_deployment_mock, logger_mock):
    # Arrange
    mock_func = MagicMock()

    # Create a mock endpoint response with not_addresses_addresses
    mock_address = MagicMock(ip="123.123.123.123")
    mock_subset = MagicMock(not_ready_addresses=[mock_address], addresses=None)
    mock_endpoint = MagicMock(subsets=[mock_subset])
    core_api_mock.read_namespaced_endpoints.return_value = mock_endpoint

    # Act
    decorated_func = ensure_endpoint()(mock_func)
    decorated_func()

    # Assert
    assert core_api_mock.read_namespaced_endpoints.call_count == 3
    assert restart_deployment_mock.call_count == 3
    mock_func.assert_called_once()


def test_create_ns(core_api_mock):
    fake_name = "fake-ns"
    fake_labels = {"fake-label": "fake-value"}
    fake_annotations = {"fake-annotation": "fake-value"}
    core_api_mock.read_namespace.side_effect = ApiException(status=404)
    create_namespace(name=fake_name, labels=fake_labels, annotations=fake_annotations)

    assert core_api_mock.create_namespace.call_count == 1


def test_disable_automount_token(core_api_mock):
    disable_automount_service_account_token()

    assert core_api_mock.patch_namespaced_service_account.call_count == 1


def test_get_secret(core_api_mock):
    name = "fake-secret"
    namespace = "fake-ns"
    get_secret_from_namespace(name=name, namespace=namespace)
    assert core_api_mock.read_namespaced_secret.call_count == 1
