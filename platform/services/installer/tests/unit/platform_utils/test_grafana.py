# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""Unit tests for the grafana module."""

from collections.abc import Mapping, Sequence
from unittest.mock import Mock, call

import pytest
from kubernetes.client import ApiClient, CoreV1Api

from constants.platform import PLATFORM_NAMESPACE
from platform_utils import grafana as grafana_utils
from tests.mock_k8s import v1_pod_from_map

_PATCH_TARGET = "platform_utils.grafana"
_MOCK_KUBE_CONFIG = "/mock/kube/config"


@pytest.mark.parametrize(
    "kube_config, components, pods_filtered, list_pod_calls_expected, pod_exec_calls_expected",
    [
        (
            _MOCK_KUBE_CONFIG,
            [grafana_utils._COMPONENT.MIMIR, grafana_utils._COMPONENT.LOKI],
            [
                [
                    v1_pod_from_map(
                        {
                            "metadata": {
                                "labels": {
                                    "app": "lgtm-stack",
                                    "app.kubernetes.io/component": "ingester",
                                    "app.kubernetes.io/instance": "impt",
                                    "app.kubernetes.io/name": "mimir",
                                    "statefulset.kubernetes.io/pod-name": "impt-mimir-ingester-0",
                                },
                                "name": "impt-mimir-ingester-0",
                                "namespace": "impt",
                            }
                        }
                    ),
                    v1_pod_from_map(
                        {
                            "metadata": {
                                "labels": {
                                    "app": "lgtm-stack",
                                    "app.kubernetes.io/component": "ingester",
                                    "app.kubernetes.io/instance": "impt",
                                    "app.kubernetes.io/name": "mimir",
                                    "statefulset.kubernetes.io/pod-name": "impt-mimir-ingester-1",
                                },
                                "name": "impt-mimir-ingester-1",
                                "namespace": "impt",
                            }
                        }
                    ),
                ],
                [
                    v1_pod_from_map(
                        {
                            "metadata": {
                                "labels": {
                                    "app": "lgtm-stack",
                                    "app.kubernetes.io/component": "write",
                                    "app.kubernetes.io/instance": "impt",
                                    "app.kubernetes.io/name": "loki",
                                    "statefulset.kubernetes.io/pod-name": "loki-0",
                                },
                                "name": "loki-write-0",
                                "namespace": "impt",
                            }
                        }
                    ),
                ],
            ],
            [
                call(
                    PLATFORM_NAMESPACE,
                    label_selector="app.kubernetes.io/name=mimir,app.kubernetes.io/component=ingester",
                ),
                call(
                    PLATFORM_NAMESPACE,
                    label_selector="app.kubernetes.io/name=loki,app.kubernetes.io/component=write",
                ),
            ],
            [
                call(
                    kube_config=_MOCK_KUBE_CONFIG,
                    pod="impt-mimir-ingester-0",
                    namespace=PLATFORM_NAMESPACE,
                    container="ingester",
                    command=["/bin/sh", "-c", "wget --post-data='' -O- 'localhost:8080/ingester/flush?wait=true'"],
                ),
                call(
                    kube_config=_MOCK_KUBE_CONFIG,
                    pod="impt-mimir-ingester-1",
                    namespace=PLATFORM_NAMESPACE,
                    container="ingester",
                    command=["/bin/sh", "-c", "wget --post-data='' -O- 'localhost:8080/ingester/flush?wait=true'"],
                ),
                call(
                    kube_config=_MOCK_KUBE_CONFIG,
                    pod="loki-write-0",
                    namespace=PLATFORM_NAMESPACE,
                    container="write",
                    command=["/bin/sh", "-c", "wget --post-data='' -O- 'localhost:3100/flush?wait=true'"],
                ),
            ],
        )
    ],
)
def test_flush_ingesters(
    mocker,
    kube_config: str,
    components: Sequence[str],
    pods_filtered: Sequence[Sequence[Mapping]],
    list_pod_calls_expected: Sequence,
    pod_exec_calls_expected: Sequence,
):
    """Tests the flush_ingesters function."""
    mocker.patch(f"{_PATCH_TARGET}._COMPONENT", components)
    mock_load_kube_config = mocker.patch(f"{_PATCH_TARGET}.KubernetesConfigHandler")

    mock_core_api = Mock(CoreV1Api)
    mock_core_api.list_namespaced_pod = Mock(side_effect=[Mock(items=elem) for elem in pods_filtered])
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.CoreV1Api", return_value=mock_core_api)
    mock_client = Mock(ApiClient)
    mock_client.__enter__ = Mock(return_value=mock_client)
    mock_client.__exit__ = Mock()
    mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.ApiClient", return_value=mock_client)

    mock_pod_exec = mocker.patch(f"{_PATCH_TARGET}.pod_exec")

    grafana_utils.flush_ingesters(kube_config)

    mock_load_kube_config.assert_called_once_with(kube_config=_MOCK_KUBE_CONFIG)
    assert mock_core_api.list_namespaced_pod.call_count == len(list_pod_calls_expected)
    mock_core_api.list_namespaced_pod.assert_has_calls(list_pod_calls_expected)
    assert mock_pod_exec.call_count == len(pod_exec_calls_expected)
    mock_pod_exec.assert_has_calls(pod_exec_calls_expected, any_order=True)


def test_pod_exec(mocker):
    """Tests the pod_exec function."""
    mock_load_kube_config = mocker.patch(f"{_PATCH_TARGET}.kubernetes.config.load_kube_config")

    mock_core_api = Mock(CoreV1Api)
    mock_core_api.connect_get_namespaced_pod_exec = Mock()
    mock_core_v1_api_type = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.CoreV1Api", side_effect=[mock_core_api])
    mock_client = Mock(ApiClient)
    mock_client.__enter__ = Mock(return_value=mock_client)
    mock_client.__exit__ = Mock()
    mock_api_client_type = mocker.patch(f"{_PATCH_TARGET}.kubernetes.client.ApiClient", side_effect=[mock_client])
    resp_expected = "Mock stream resp"
    mock_stream = mocker.patch(f"{_PATCH_TARGET}.stream", side_effect=[resp_expected])

    mock_pod_name = "pod-name-0"
    mock_container_name = "ctr-1"
    mock_command = ["cmd", "1"]

    resp_actual = grafana_utils.pod_exec(
        kube_config=_MOCK_KUBE_CONFIG,
        pod=mock_pod_name,
        namespace=PLATFORM_NAMESPACE,
        container=mock_container_name,
        command=mock_command,
    )

    assert resp_actual == resp_expected
    mock_load_kube_config.assert_called_once_with(config_file=_MOCK_KUBE_CONFIG)
    mock_api_client_type.assert_called_once_with()
    mock_core_v1_api_type.assert_called_once_with(mock_client)
    mock_stream.assert_called_once_with(
        mock_core_api.connect_get_namespaced_pod_exec,
        name=mock_pod_name,
        namespace=PLATFORM_NAMESPACE,
        container=mock_container_name,
        command=mock_command,
        stderr=True,
        stdout=True,
        stdin=False,
        tty=False,
    )
