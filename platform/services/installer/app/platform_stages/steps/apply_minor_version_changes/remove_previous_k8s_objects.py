# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import logging
from typing import TYPE_CHECKING

from platform_stages.steps.errors import RemovePreviousK8SObjectsError
from platform_utils.kube_config_handler import KubernetesConfigHandler

if TYPE_CHECKING:
    from collections.abc import Callable

import kubernetes

from constants.paths import K3S_KUBECONFIG_PATH

logger = logging.getLogger(__name__)


def _remove_flyte_secret():
    with kubernetes.client.ApiClient() as api_client:
        core_api = kubernetes.client.CoreV1Api(api_client)
        try:
            logger.debug("Deleting flyte-pod-webhook secret.")
            core_api.delete_namespaced_secret(name="flyte-pod-webhook", namespace="flyte")
        except kubernetes.client.exceptions.ApiException as ex:
            if ex.status != 404:
                logger.error("Error when accessing the Kubernetes API.", exc_info=True)
                raise RemovePreviousK8SObjectsError from ex
    logger.debug("Deleted secret.")


def _remove_modelmesh_webhook_conf():
    with kubernetes.client.ApiClient() as api_client:
        logger.debug("Deleting modelmesh webhook conf.")
        admission_registration_api = kubernetes.client.AdmissionregistrationV1Api(api_client)
        try:
            admission_registration_api.delete_validating_webhook_configuration(name="servingruntime.serving.kserve.io")
        except kubernetes.client.exceptions.ApiException as ex:
            if ex.status != 404:
                logger.error("Error when accessing the Kubernetes API.", exc_info=True)
                raise RemovePreviousK8SObjectsError from ex
    logger.debug("Deleted webhook conf.")


def _remove_secret():
    with kubernetes.client.ApiClient() as api_client:
        core_api = kubernetes.client.CoreV1Api(api_client)
        try:
            logger.debug("Deleting istio-ca secret.")
            core_api.delete_namespaced_secret(name="istio-ca", namespace="cert-manager")
        except kubernetes.client.exceptions.ApiException as ex:
            if ex.status != 404:
                logger.error("Error when accessing the Kubernetes API.", exc_info=True)
                raise RemovePreviousK8SObjectsError from ex
        logger.debug("Deleted secret.")


def _remove_deployment():
    with kubernetes.client.ApiClient() as api_client:
        core_api = kubernetes.client.AppsV1Api(api_client)
        try:
            logger.debug("Deleting reloader deployment.")
            core_api.delete_namespaced_deployment(name="reloader", namespace="impt")
        except kubernetes.client.exceptions.ApiException as ex:
            if ex.status != 404:
                logger.error("Error when accessing the Kubernetes API.", exc_info=True)
                raise RemovePreviousK8SObjectsError from ex
        logger.debug("Deleted deployment.")


def remove_previous_k8s_objects() -> None:
    """
    Remove previous k8s objects during upgrade
    """
    logger.info("Removing previous k8s objects.")
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)

    tasks: list[Callable] = [
        _remove_flyte_secret,
        _remove_modelmesh_webhook_conf,
        _remove_secret,
        _remove_deployment,
    ]

    for task in tasks:
        task()
    logger.info("Previous k8s objects removed.")
