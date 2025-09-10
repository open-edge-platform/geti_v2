# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""Grafana stack management functions"""

import logging
from collections.abc import Mapping, Sequence
from enum import Enum

import kubernetes
from kubernetes.stream import stream

from constants.platform import PLATFORM_NAMESPACE
from platform_utils.kube_config_handler import KubernetesConfigHandler

logger = logging.getLogger(__name__)


class _COMPONENT(str, Enum):
    """Represents a Grafana stack component."""

    MIMIR = "mimir"
    TEMPO = "tempo"
    LOKI = "loki"


_COMPONENT_TO_CONTAINER: Mapping[str, str] = {
    _COMPONENT.MIMIR: "ingester",
    _COMPONENT.TEMPO: "ingester",
    _COMPONENT.LOKI: "write",
}

_COMPONENT_TO_LABELS: Mapping[str, Mapping[str, str]] = {
    _COMPONENT.MIMIR: {"app.kubernetes.io/name": "mimir", "app.kubernetes.io/component": "ingester"},
    _COMPONENT.TEMPO: {"app.kubernetes.io/name": "tempo", "app.kubernetes.io/component": "ingester"},
    _COMPONENT.LOKI: {"app.kubernetes.io/name": "loki", "app.kubernetes.io/component": "write"},
}

_COMPONENT_TO_FLUSH_CMD: Mapping[str, Sequence[str]] = {
    _COMPONENT.MIMIR: ["/bin/sh", "-c", "wget --post-data='' -O- 'localhost:8080/ingester/flush?wait=true'"],
    _COMPONENT.TEMPO: ["/bin/sh", "-c", "wget --post-data='' -O- 'localhost:3100/flush?wait=true'"],
    _COMPONENT.LOKI: ["/bin/sh", "-c", "wget --post-data='' -O- 'localhost:3100/flush?wait=true'"],
}


def flush_ingesters(kube_config: str):  # noqa: ANN201
    """Trigger pending data flush in LGTM stack ingesters."""
    KubernetesConfigHandler(kube_config=kube_config)

    for component in _COMPONENT:
        label_selector = ",".join(f"{key}={val}" for key, val in _COMPONENT_TO_LABELS[component].items())

        with kubernetes.client.ApiClient() as client:
            core_api = kubernetes.client.CoreV1Api(client)
            pods = core_api.list_namespaced_pod(PLATFORM_NAMESPACE, label_selector=label_selector).items

        for pod in pods:
            logger.debug(f"Flushing {pod.metadata.name}")
            pod_exec(
                kube_config=kube_config,
                pod=pod.metadata.name,
                namespace=pod.metadata.namespace,
                container=_COMPONENT_TO_CONTAINER[component],
                command=_COMPONENT_TO_FLUSH_CMD[component],
            )


def pod_exec(kube_config: str, pod: str, namespace: str, container: str, command: Sequence[str]) -> str:
    """Executes the provided command on the target pod.

    :param kube_config: Path to kubeconfig file.
    :param pod: Target pod name.
    :param namespace: Target namespace.
    :param container: Target container name, within the target pod.
    :param command: Command to execute on the target pod.
    :return str: Standard stream output resulting from command execution.
    """
    kubernetes.config.load_kube_config(config_file=kube_config)

    with kubernetes.client.ApiClient() as client:
        core_api = kubernetes.client.CoreV1Api(client)
        logger.debug(
            f"Running pod exec: pod={repr(pod)}, namespace={repr(namespace)}, "
            f"container={repr(container)}, command={repr(str(command))}"
        )

        resp = stream(
            core_api.connect_get_namespaced_pod_exec,
            name=pod,
            namespace=namespace,
            container=container,
            command=command,
            stderr=True,
            stdin=False,
            stdout=True,
            tty=False,
        )

        logger.debug(f"Result: {repr(resp)}")

        return resp
