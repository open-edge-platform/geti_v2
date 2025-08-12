# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from unittest.mock import MagicMock

import pytest

from configuration_models.upgrade_config import UpgradeConfig
from platform_stages.steps.apply_minor_version_changes.relabel import _label_k8s_object, add_helm_label


@pytest.fixture
def upgrade_config():
    config = UpgradeConfig(False, install_telemetry_stack=False)
    config.kube_config = MagicMock(value="/etc/rancher/k3s/k3s.yaml")
    return config


@pytest.fixture
def metadata_patch():
    return {
        "labels": {"app.kubernetes.io/managed-by": "Helm"},
        "annotations": {
            "meta.helm.sh/release-namespace": "impt",
            "meta.helm.sh/release-name": "internal-registry",
        },
    }


def test_add_label(mocker, upgrade_config):
    mock_load_kube_config = mocker.patch(
        "platform_stages.steps.apply_minor_version_changes.relabel.KubernetesConfigHandler"
    )
    mock_core_api = mocker.patch(
        "platform_stages.steps.apply_minor_version_changes.relabel.kubernetes.client.CoreV1Api"
    )
    mock_core_api_instance = mock_core_api.return_value

    mock_apps_api = mocker.patch(
        "platform_stages.steps.apply_minor_version_changes.relabel.kubernetes.client.AppsV1Api"
    )
    mock_apps_api_instance = mock_apps_api.return_value

    mock_custom_api = mocker.patch(
        "platform_stages.steps.apply_minor_version_changes.relabel.kubernetes.client.CustomObjectsApi"
    )
    mock_custom_api_instance = mock_custom_api.return_value

    mock_admission_registration_api = mocker.patch(
        "platform_stages.steps.apply_minor_version_changes.relabel.kubernetes.client.AdmissionregistrationV1Api"
    )
    mock_admission_registration_api_instance = mock_admission_registration_api.return_value

    mock_rbac_authorization_api = mocker.patch(
        "platform_stages.steps.apply_minor_version_changes.relabel.kubernetes.client.RbacAuthorizationV1Api"
    )
    mock_rbac_authorization_api_instance = mock_rbac_authorization_api.return_value

    add_helm_label()

    mock_load_kube_config.assert_called_with(kube_config=upgrade_config.kube_config.value)
    assert mock_load_kube_config.call_count == 17
    assert mock_core_api_instance.read_namespaced_secret.call_count == 7
    assert mock_core_api_instance.patch_namespaced_secret.call_count == 7
    assert mock_core_api_instance.read_namespaced_service_account.call_count == 2
    assert mock_core_api_instance.patch_namespaced_service_account.call_count == 2
    assert mock_core_api_instance.read_namespaced_config_map.call_count == 1
    assert mock_core_api_instance.patch_namespaced_config_map.call_count == 1
    assert mock_core_api_instance.read_namespaced_service.call_count == 1
    assert mock_core_api_instance.patch_namespaced_service.call_count == 1
    assert mock_apps_api_instance.read_namespaced_deployment.call_count == 1
    assert mock_apps_api_instance.patch_namespaced_deployment.call_count == 1
    assert mock_custom_api_instance.get_namespaced_custom_object.call_count == 2
    assert mock_custom_api_instance.patch_namespaced_custom_object.call_count == 2
    assert mock_admission_registration_api_instance.read_mutating_webhook_configuration.call_count == 1
    assert mock_admission_registration_api_instance.patch_mutating_webhook_configuration.call_count == 1
    assert mock_rbac_authorization_api_instance.read_cluster_role.call_count == 1
    assert mock_rbac_authorization_api_instance.patch_cluster_role.call_count == 1
    assert mock_rbac_authorization_api_instance.read_cluster_role_binding.call_count == 1
    assert mock_rbac_authorization_api_instance.patch_cluster_role_binding.call_count == 1


def test_label_k8s_object(mocker, upgrade_config, metadata_patch):
    mock_load_kube_config = mocker.patch(
        "platform_stages.steps.apply_minor_version_changes.relabel.KubernetesConfigHandler"
    )
    mock_core_api = mocker.patch(
        "platform_stages.steps.apply_minor_version_changes.relabel.kubernetes.client.CoreV1Api"
    )
    mock_core_api_instance = mock_core_api.return_value
    secret = MagicMock()
    secret.metadata.labels = {}
    secret.metadata.annotations = {}
    mock_core_api_instance.read_namespaced_secret.return_value = secret

    _label_k8s_object("flyte", "regcred", metadata_patch, object_type="secret")

    mock_load_kube_config.assert_called_once_with(kube_config=upgrade_config.kube_config.value)
    mock_core_api_instance.read_namespaced_secret.assert_called_once_with("regcred", "flyte")

    assert secret.metadata.labels == metadata_patch["labels"]
    assert secret.metadata.annotations == metadata_patch["annotations"]

    mock_core_api_instance.patch_namespaced_secret.assert_called_once_with("regcred", "flyte", secret)
