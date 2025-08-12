# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from unittest.mock import MagicMock, Mock

import kubernetes
import pytest
from kubernetes.client import ApiClient, AppsV1Api, V1DaemonSet, V1ObjectMeta, V2HorizontalPodAutoscaler

from constants.platform import PLATFORM_NAMESPACE
from platform_utils.management import management

_PATCH_TARGET = "platform_utils.management.management"
_MOCK_KUBE_CONFIG = "/mock/kube/config"


def test_cancel_running_platform_workloads(mocker):
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.config.load_kube_config")

    mock_training_tasks_list = {"items": [{"metadata": {"name": "training-task-1"}, "status": {"current": "RUNNING"}}]}
    mock_inference_job_tasks_list: dict = {"items": []}
    mock_inference_server_tasks_list: dict = {"items": []}

    mock_custom_api = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.CustomObjectsApi")
    mock_list_namespaced_custom_object = mock_custom_api.return_value.list_namespaced_custom_object
    mock_list_namespaced_custom_object.side_effect = [
        mock_training_tasks_list,
        mock_inference_job_tasks_list,
        mock_inference_server_tasks_list,
    ]
    mock_patch_namespaced_custom_object = mock_custom_api.return_value.patch_namespaced_custom_object

    mock_core_api = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.CoreV1Api")
    mock_list_namespaced_pod = mock_core_api.return_value.list_namespaced_pod
    mock_list_namespaced_pod.return_value = MagicMock(items=[])

    management.STOP_AFTER_ATTEMPT = 1
    management.WAIT_FIXED = 1

    mock_config = MagicMock()
    management.remove_platform_workloads_tasks(mock_config)

    assert mock_patch_namespaced_custom_object.call_count == 1


def test_cancel_running_platform_workloads_pod_still_present_exception(mocker):
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.config.load_kube_config")

    mock_training_tasks_list = {"items": [{"metadata": {"name": "training-task-1"}, "status": {"current": "RUNNING"}}]}
    mock_inference_job_tasks_list: dict = {"items": []}
    mock_inference_server_tasks_list: dict = {"items": []}

    mock_training_pod_metadata = MagicMock()
    mock_training_pod_metadata.name = "training-task-1-master-0"
    mock_training_pod = MagicMock(metadata=mock_training_pod_metadata)
    mock_pods = [mock_training_pod]

    mock_custom_api = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.CustomObjectsApi")
    mock_list_namespaced_custom_object = mock_custom_api.return_value.list_namespaced_custom_object
    mock_list_namespaced_custom_object.side_effect = [
        mock_training_tasks_list,
        mock_inference_job_tasks_list,
        mock_inference_server_tasks_list,
    ]

    mock_core_api = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.CoreV1Api")
    mock_list_namespaced_pod = mock_core_api.return_value.list_namespaced_pod
    mock_list_namespaced_pod.return_value = MagicMock(items=mock_pods)

    mock_config = MagicMock()
    with pytest.raises(management.PodStillPresent):
        management.remove_platform_workloads_tasks(mock_config)


def test_cancel_running_platform_workloads_no_tasks_to_cancel(mocker):
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.config.load_kube_config")

    mock_training_tasks_list: dict = {"items": []}
    mock_inference_job_tasks_list: dict = {"items": []}
    mock_inference_server_tasks_list: dict = {"items": []}

    mock_custom_api = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.CustomObjectsApi")
    mock_list_namespaced_custom_object = mock_custom_api.return_value.list_namespaced_custom_object
    mock_list_namespaced_custom_object.side_effect = [
        mock_training_tasks_list,
        mock_inference_job_tasks_list,
        mock_inference_server_tasks_list,
    ]
    mock_patch_namespaced_custom_object = mock_custom_api.return_value.patch_namespaced_custom_object
    mock_delete_namespaced_custom_object = mock_custom_api.return_value.delete_namespaced_custom_object

    mock_core_api = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.CoreV1Api")
    mock_list_namespaced_pod = mock_core_api.return_value.list_namespaced_pod
    mock_list_namespaced_pod.return_value = MagicMock(items=[])

    mock_config = MagicMock()
    management.remove_platform_workloads_tasks(mock_config)

    mock_list_namespaced_pod.assert_not_called()
    mock_patch_namespaced_custom_object.assert_not_called()
    mock_delete_namespaced_custom_object.assert_not_called()


def test_delete_inference_server(mocker):
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.config.load_kube_config")

    mock_training_tasks_list: dict = {"items": []}
    mock_inference_job_tasks_list: dict = {"items": []}
    mock_inference_server_tasks_list = {
        "items": [{"metadata": {"name": "inference-server-task-1"}, "status": {"current": "RUNNING"}}]
    }

    mock_custom_api = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.CustomObjectsApi")
    mock_list_namespaced_custom_object = mock_custom_api.return_value.list_namespaced_custom_object
    mock_list_namespaced_custom_object.side_effect = [
        mock_training_tasks_list,
        mock_inference_job_tasks_list,
        mock_inference_server_tasks_list,
    ]
    mock_patch_namespaced_custom_object = mock_custom_api.return_value.patch_namespaced_custom_object
    mock_delete_namespaced_custom_object = mock_custom_api.return_value.delete_namespaced_custom_object

    mock_core_api = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.CoreV1Api")
    mock_list_namespaced_pod = mock_core_api.return_value.list_namespaced_pod
    mock_list_namespaced_pod.return_value = MagicMock(items=[])

    management.STOP_AFTER_ATTEMPT = 1
    management.WAIT_FIXED = 1

    mock_config = MagicMock()
    management.remove_platform_workloads_tasks(mock_config)

    assert mock_delete_namespaced_custom_object.call_count == 1

    mock_patch_namespaced_custom_object.assert_called_once_with(
        body={
            "metadata": {
                "finalizers": [],
            }
        },
        name="inference-server-task-1",
        namespace=PLATFORM_NAMESPACE,
        group="impt.intel.com",
        plural="inferenceservertasks",
        version="v1",
    )


def test_delete_rate_limiters_before_upgrade_empty(mocker):
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.config.load_kube_config")

    mock_logger = mocker.patch(f"{_PATCH_TARGET}.logger")

    mock_custom_api = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.CustomObjectsApi")
    mock_delete_namespaced_custom_object = mock_custom_api.return_value.delete_namespaced_custom_object
    mock_delete_namespaced_custom_object.side_effect = [
        kubernetes.client.exceptions.ApiException(status=404),
        None,
        kubernetes.client.exceptions.ApiException(status=500),
    ]

    mock_client = Mock(ApiClient)
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.ApiClient", return_value=mock_client)

    with pytest.raises(kubernetes.client.exceptions.ApiException) as ex:
        management.delete_rate_limiters(api_client=mock_client)

    assert ex.value.status == 500
    assert mock_delete_namespaced_custom_object.call_count == 3
    mock_delete_namespaced_custom_object.assert_any_call(
        group="networking.istio.io",
        version="v1alpha3",
        namespace=PLATFORM_NAMESPACE,
        plural="envoyfilters",
        name="impt-seaweed-fs-rate-limiter",
    )
    mock_logger.info.assert_called_with("Envoy filter: 'impt-seaweed-fs-rate-limiter' not found — skipping")
    mock_delete_namespaced_custom_object.assert_any_call(
        group="networking.istio.io",
        version="v1alpha3",
        namespace=PLATFORM_NAMESPACE,
        plural="envoyfilters",
        name="control-plane-account-service-rate-limiter",
    )
    mock_delete_namespaced_custom_object.assert_any_call(
        group="networking.istio.io",
        version="v1alpha3",
        namespace=PLATFORM_NAMESPACE,
        plural="envoyfilters",
        name="impt-account-service-rate-limiter",
    )


def test_delete_rate_limiters_before_upgrade(mocker):
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.config.load_kube_config")

    mock_custom_api = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.CustomObjectsApi")
    mock_delete_namespaced_custom_object = mock_custom_api.return_value.delete_namespaced_custom_object

    mock_client = Mock(ApiClient)
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.ApiClient", return_value=mock_client)

    management.delete_rate_limiters(api_client=mock_client)

    assert mock_delete_namespaced_custom_object.call_count == 3
    mock_delete_namespaced_custom_object.assert_any_call(
        group="networking.istio.io",
        version="v1alpha3",
        namespace=PLATFORM_NAMESPACE,
        plural="envoyfilters",
        name="impt-seaweed-fs-rate-limiter",
    )
    mock_delete_namespaced_custom_object.assert_any_call(
        group="networking.istio.io",
        version="v1alpha3",
        namespace=PLATFORM_NAMESPACE,
        plural="envoyfilters",
        name="control-plane-account-service-rate-limiter",
    )
    mock_delete_namespaced_custom_object.assert_any_call(
        group="networking.istio.io",
        version="v1alpha3",
        namespace=PLATFORM_NAMESPACE,
        plural="envoyfilters",
        name="impt-account-service-rate-limiter",
    )


def test_get_ordered_deployments(mocker):
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.config.load_kube_config")

    mock_deployments = [
        MagicMock(api_version="apps/v1", kind="Deployment"),
        MagicMock(api_version="apps/v1", kind="Deployment"),
    ]

    mock_deployments[0].metadata.name = "impt-account-service"
    mock_deployments[1].metadata.name = "impt-modelmesh-controller"

    mock_apps_api = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.AppsV1Api")
    mock_list_namespaced_deployment = mock_apps_api.list_namespaced_deployment
    mock_list_namespaced_deployment.return_value.items = mock_deployments

    deployments = management.get_ordered_deployments(apps_api=mock_apps_api)
    assert deployments[0].metadata.name == "impt-modelmesh-controller"


def test_delete_hpa_before_upgrade_no_hpa(mocker):
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.config.load_kube_config")

    mock_autoscaling_api = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.AutoscalingV2Api")

    mock_list_namespaced_horizontal_pod_autoscaler = (
        mock_autoscaling_api.return_value.list_namespaced_horizontal_pod_autoscaler
    )
    mock_list_namespaced_horizontal_pod_autoscaler.return_value = MagicMock(items=[])
    mock_delete_namespaced_horizontal_pod_autoscaler = (
        mock_autoscaling_api.return_value.delete_namespaced_horizontal_pod_autoscaler
    )

    mock_client = Mock(ApiClient)
    mock_client.__enter__ = Mock(return_value=mock_client)
    mock_client.__exit__ = Mock()
    mock_api_client_type = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.ApiClient", side_effect=[mock_client])

    management.delete_hpa(api_client=mock_api_client_type)

    assert mock_list_namespaced_horizontal_pod_autoscaler.call_count == 1
    assert mock_delete_namespaced_horizontal_pod_autoscaler.call_count == 0


def test_delete_hpa_before_upgrade_with_hpa(mocker):
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.config.load_kube_config")

    mock_autoscaling_api = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.AutoscalingV2Api")

    mock_hpa = V2HorizontalPodAutoscaler(metadata=V1ObjectMeta(name="impt-director"))
    mock_list_namespaced_horizontal_pod_autoscaler = (
        mock_autoscaling_api.return_value.list_namespaced_horizontal_pod_autoscaler
    )
    mock_list_namespaced_horizontal_pod_autoscaler.return_value = MagicMock(items=[mock_hpa])
    mock_delete_namespaced_horizontal_pod_autoscaler = (
        mock_autoscaling_api.return_value.delete_namespaced_horizontal_pod_autoscaler
    )

    mock_client = Mock(ApiClient)
    mock_client.__enter__ = Mock(return_value=mock_client)
    mock_client.__exit__ = Mock()
    mock_api_client_type = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.ApiClient", side_effect=[mock_client])

    management.delete_hpa(api_client=mock_api_client_type)

    assert mock_list_namespaced_horizontal_pod_autoscaler.call_count == 1
    assert mock_delete_namespaced_horizontal_pod_autoscaler.call_count == 1


def test_replace_daemon_set_with_fetch_retry_add_action(mocker):
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.config.load_kube_config")
    mock_apps_api = MagicMock(spec=AppsV1Api)
    mock_daemon_set = MagicMock(spec=V1DaemonSet)
    mock_daemon_set.metadata.name = "test-daemonset"
    mock_daemon_set.metadata.namespace = "test-namespace"
    mock_daemon_set.spec.template.spec.node_selector = {}

    management._replace_daemon_set_with_fetch_retry(apps_api=mock_apps_api, daemon_set=mock_daemon_set, action="add")

    assert mock_daemon_set.spec.template.spec.node_selector["non-existing"] == "true"
    mock_apps_api.replace_namespaced_daemon_set.assert_called_once_with(
        name="test-daemonset", namespace="test-namespace", body=mock_daemon_set
    )


def test_replace_daemon_set_with_fetch_retry_remove_action(mocker):
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.config.load_kube_config")
    mock_apps_api = MagicMock(spec=AppsV1Api)
    mock_daemon_set = MagicMock(spec=V1DaemonSet)
    mock_daemon_set.metadata.name = "test-daemonset"
    mock_daemon_set.metadata.namespace = "test-namespace"
    mock_daemon_set.spec.template.spec.node_selector = {"non-existing": "true"}

    management._replace_daemon_set_with_fetch_retry(apps_api=mock_apps_api, daemon_set=mock_daemon_set, action="remove")

    assert "non-existing" not in mock_daemon_set.spec.template.spec.node_selector
    mock_apps_api.replace_namespaced_daemon_set.assert_called_once_with(
        name="test-daemonset", namespace="test-namespace", body=mock_daemon_set
    )


def test_replace_daemon_set_with_fetch_retry_invalid_action(mocker):
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.config.load_kube_config")
    mock_apps_api = MagicMock(spec=AppsV1Api)
    mock_daemon_set = MagicMock(spec=V1DaemonSet)

    with pytest.raises(ValueError, match="Invalid action. Use 'add' or 'remove'."):
        management._replace_daemon_set_with_fetch_retry(
            apps_api=mock_apps_api, daemon_set=mock_daemon_set, action="invalid"
        )
