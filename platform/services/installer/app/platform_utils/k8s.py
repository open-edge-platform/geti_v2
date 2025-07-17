# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
Utility functions related to Kubernetes.
"""

import base64
import http
import logging
from collections import namedtuple
from collections.abc import Callable
from datetime import datetime

import pytz
from kubernetes import client
from kubernetes.client import ApiException

from constants.paths import K3S_KUBECONFIG_PATH
from platform_utils.errors import RestartDeploymentError
from platform_utils.kube_config_handler import KubernetesConfigHandler

logger = logging.getLogger(__name__)
STOP_AFTER_ATTEMPT = 5
WAIT_FIXED = 5

Endpoint = namedtuple("Endpoint", ["namespace", "name"])  # noqa: PYI024
ISTIOD = Endpoint(name="istiod", namespace="istio-system")
CERT_MANAGER_WEBHOOK = Endpoint(name="cert-manager-webhook", namespace="cert-manager")
OPA = Endpoint(name="admission-controller", namespace="opa-istio")

REQUIRED_ENDPOINTS = [ISTIOD, CERT_MANAGER_WEBHOOK, OPA]
MASTER_NODE_LABEL = "node-role.kubernetes.io/control-plane"


def decode_string_b64(data: str) -> str:  # noqa: D103
    return base64.b64decode(data).decode("utf-8")


def encode_data_b64(data: bytes) -> str:  # noqa: D103
    return base64.b64encode(data).decode("utf-8")


def ensure_endpoint() -> Callable:
    """Checks whether the endpoint are ready when ip is assigned."""

    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
            core_v1_api = client.CoreV1Api()
            for endpoint in REQUIRED_ENDPOINTS:
                try:
                    logger.info(f"For endpoint '{endpoint.name}' in namespace '{endpoint.namespace}':")
                    logger.info("Check if ip is properly assigned.")
                    k8s_endpoint = core_v1_api.read_namespaced_endpoints(
                        name=endpoint.name, namespace=endpoint.namespace
                    )

                    subsets = k8s_endpoint.subsets if k8s_endpoint.subsets else []
                    is_endpoint_ready = (
                        len([address.ip for subset in subsets for address in (subset.addresses or [])]) > 0
                    )
                    logger.debug(f"Is endpoint ready: {is_endpoint_ready}")

                    if not is_endpoint_ready:
                        logger.info("Endpoint is not ready (no ip), then deployment needs to be restarted.")
                        logger.debug(f"Endpoints subsets: {subsets}")
                        restart_deployment(endpoint.name, endpoint.namespace)

                except ApiException as api_err:
                    if api_err.status == http.HTTPStatus.NOT_FOUND:
                        # we do not care if endpoint does not exist
                        continue
            return func(*args, **kwargs)

        return wrapper

    return decorator


def restart_deployment(name: str, namespace: str | None = None) -> None:
    """
    Restart Kubernetes Deployment.
    """
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    v1dep = client.AppsV1Api()
    logger.info(f"Deployment '{name}' is being restarted.")
    try:
        v1dep.patch_namespaced_deployment(
            name=name,
            namespace=namespace,
            body=_get_restarted_at_patch_body(),
        )
    except ApiException as ex:
        raise RestartDeploymentError from ex
    logger.info("Deployment is restarted.")


def _get_restarted_at_patch_body():
    """
    Return patch body used to restart a Deployment now.
    """
    return {
        "spec": {
            "template": {
                "metadata": {
                    "annotations": {
                        "kubectl.kubernetes.io/restartedAt": datetime.utcnow().replace(tzinfo=pytz.UTC).isoformat()
                    }
                }
            }
        }
    }
