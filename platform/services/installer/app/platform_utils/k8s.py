# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import logging
import time

from kubernetes import client, config
from kubernetes.client.rest import ApiException

from constants.paths import K3S_KUBECONFIG_PATH

logger = logging.getLogger(__name__)


class KubernetesConfigHandler:
    """
    Singleton class to manage the loading and reloading of Kubernetes configuration.

    This class ensures that the Kubernetes configuration is loaded only once
    and provides a mechanism to reload the configuration with a different
    kubeconfig file if necessary.
    """

    _instance = None

    def __new__(cls, kube_config: str = K3S_KUBECONFIG_PATH):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._load_kube_config(kube_config=kube_config)
        return cls._instance

    @classmethod
    def _load_kube_config(cls, kube_config: str = K3S_KUBECONFIG_PATH):
        config.load_kube_config(config_file=kube_config)
        return config

    @classmethod
    def reload(cls, kube_config: str):
        cls._instance = None
        cls._instance = cls(kube_config)
        return cls._instance


def is_service_ready(service_name: str, namespace: str) -> bool:
    """
    Waits until the Geti Controller service has a ready endpoint.
    """
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    core_v1_api = client.CoreV1Api()

    for attempt in range(30):
        try:
            logger.debug(
                f"Checking readiness of service '{service_name}' in namespace '{namespace}' (attempt {attempt})"
            )
            endpoints = core_v1_api.read_namespaced_endpoints(name=service_name, namespace=namespace)
            subsets = endpoints.subsets or []
            ready = any(subset.addresses for subset in subsets)
            logger.debug(f"Endpoint ready: {ready}")
            if ready:
                logger.debug(f"{service_name} service is ready.")
                return True
        except ApiException as api_err:
            logger.warning(f"API error while checking service: {api_err}")
        time.sleep(5)
    logger.error(f"{service_name} service has not become ready in time.")
    return False
