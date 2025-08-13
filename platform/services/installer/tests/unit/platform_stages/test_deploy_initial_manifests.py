# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from unittest.mock import MagicMock

import pytest
from kubernetes.client import ApiException

from platform_stages.steps.deploy_initial_manifests import deploy_initial_manifests
from platform_stages.steps.errors import NamespaceCreationError


@pytest.fixture
def mock_core_v1_api(mocker):
    mocker.patch("platform_utils.k8s.KubernetesConfigHandler")
    mock_core_api = mocker.patch("platform_utils.k8s.client.CoreV1Api")
    mock_core_api_instance = mock_core_api.return_value
    return mock_core_api_instance


def test_deploy_manifests(mock_core_v1_api):
    mock_core_v1_api.read_namespace.side_effect = ApiException(status=404)
    mock_core_v1_api.create_namespace.return_value = MagicMock()
    deploy_initial_manifests()
    assert mock_core_v1_api.create_namespace.call_count == 6
    assert mock_core_v1_api.patch_namespace.call_count == 0


def test_failed_ns_creation(mock_core_v1_api):
    mock_core_v1_api.patch_namespace.side_effect = ApiException(status=500)
    mock_core_v1_api.read_namespace.return_value = MagicMock(metadata=MagicMock(labels={}, annotations={}))
    with pytest.raises(NamespaceCreationError):
        deploy_initial_manifests()


def test_namespace_update(mock_core_v1_api):
    mock_core_v1_api.read_namespace.return_value = MagicMock(
        metadata=MagicMock(labels={"env": "production"}, annotations={})
    )
    deploy_initial_manifests()
    assert mock_core_v1_api.patch_namespace.call_count == 6
