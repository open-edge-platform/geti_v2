# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module containing check functions that are interacting with Platform.
"""

import logging
import os
import re
from typing import TYPE_CHECKING

from kubernetes import client

from checks.errors import CheckError, CheckSkipped
from constants.platform import PLATFORM_CONFIGURATION_CM_NAME, PLATFORM_NAMESPACE, PLATFORM_VERSION_CM_KEY
from platform_utils.kube_config_handler import KubernetesConfigHandler
from texts.checks import PlatformCheckTexts

if TYPE_CHECKING:
    from kubernetes.client import V1ConfigMap

logger = logging.getLogger(__name__)

SUPPORTED_VERSIONS = [
    "2.0.0",
    "2.0.1",
    "2.0.2",
    "2.3.0",
    "2.3.1",
    "2.3.2",
    "2.6.0",
    "2.7.0",
    "2.9.0",
    "2.10.0",
    "2.10.1",
    "2.10.2",
    "2.11.0",
    "2.12.0",
    "2.12.1",
]


def check_platform_version(kubeconfig_path: str) -> None:
    """
    Check Platform's version if it's supported.
    """
    logger.debug("Checking if Geti platform version is correct.")
    is_platform_version_check_enabled = os.getenv("PLATFORM_VERSION_CHECK", "true")
    if is_platform_version_check_enabled.lower() == "false":
        raise CheckSkipped

    KubernetesConfigHandler(kube_config=kubeconfig_path)

    with client.ApiClient() as kube_client:
        api_instance = client.CoreV1Api(kube_client)
        configuration_configmap: V1ConfigMap = api_instance.read_namespaced_config_map(
            name=PLATFORM_CONFIGURATION_CM_NAME, namespace=PLATFORM_NAMESPACE
        )
        platform_version = configuration_configmap.data[PLATFORM_VERSION_CM_KEY]

    if not any(re.search(supported_version, platform_version) for supported_version in SUPPORTED_VERSIONS):
        raise CheckError(
            PlatformCheckTexts.platform_version_check_error.format(
                platform_version=platform_version, allowed_versions=SUPPORTED_VERSIONS
            )
        )


def check_if_platform_installed(kubeconfig_path: str) -> None:
    """
    Throws CheckError if the platform is installed.
    """
    logger.debug("Checking if Geti platform is installed.")
    is_platform_version_check_enabled = os.getenv("PLATFORM_VERSION_CHECK", "true")
    if is_platform_version_check_enabled.lower() == "false":
        raise CheckSkipped

    KubernetesConfigHandler(kube_config=kubeconfig_path)

    try:
        with client.ApiClient() as kube_client:
            api_instance = client.CoreV1Api(kube_client)
            api_instance.read_namespaced_config_map(name=PLATFORM_CONFIGURATION_CM_NAME, namespace=PLATFORM_NAMESPACE)
            raise CheckError(PlatformCheckTexts.platform_installed_check_error)

    except client.exceptions.ApiException:
        pass


def check_if_platform_not_installed(kubeconfig_path: str) -> None:
    """
    Throws CheckError if the platform is not installed.
    """
    logger.debug("Checking if Geti platform is installed.")
    is_platform_version_check_enabled = os.getenv("PLATFORM_VERSION_CHECK", "true")
    if is_platform_version_check_enabled.lower() == "false":
        raise CheckSkipped

    KubernetesConfigHandler(kube_config=kubeconfig_path)

    try:
        with client.ApiClient() as kube_client:
            api_instance = client.CoreV1Api(kube_client)
            api_instance.read_namespace_status(name=PLATFORM_NAMESPACE)

    except client.exceptions.ApiException:
        raise CheckError(PlatformCheckTexts.platform_not_installed_check_error)
