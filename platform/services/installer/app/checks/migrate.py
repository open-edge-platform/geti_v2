# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import logging
import re
from typing import TYPE_CHECKING

from kubernetes import client
from packaging.version import Version

from checks.errors import MigrateCheckError
from constants.platform import (
    PLATFORM_CONFIGURATION_CM_NAME,
    PLATFORM_NAMESPACE,
    PLATFORM_VERSION_CM_KEY,
)
from platform_utils.kube_config_handler import KubernetesConfigHandler

if TYPE_CHECKING:
    from kubernetes.client import V1ConfigMap
from constants.paths import K3S_KUBECONFIG_PATH
from texts.checks import MigrationChecksTexts

logger = logging.getLogger(__name__)

GETI_VERSION_WITHOUT_CONTROLLER = "2.13.0"


def is_migration_possible() -> None:
    """
    Check if the Geti version is older than 2.13.0.
    This function is used to determine if migration is required.
    """
    logger.debug("Checking if Geti platform version is correct.")

    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)

    with client.ApiClient() as kube_client:
        api_instance = client.CoreV1Api(kube_client)
        configuration_configmap: V1ConfigMap = api_instance.read_namespaced_config_map(
            name=PLATFORM_CONFIGURATION_CM_NAME, namespace=PLATFORM_NAMESPACE
        )
        cm_platform_version = configuration_configmap.data[PLATFORM_VERSION_CM_KEY]

    platform_version_match = re.match(r"^\d+\.\d+\.\d+", cm_platform_version)
    if platform_version_match is None:
        raise MigrateCheckError(
            MigrationChecksTexts.migration_version_check_error.format(platform_version=cm_platform_version)
        )

    platform_version = Version(platform_version_match.group())
    border_version = Version(GETI_VERSION_WITHOUT_CONTROLLER)

    if platform_version >= border_version:
        raise MigrateCheckError(
            MigrationChecksTexts.migration_check_error.format(
                platform_version=platform_version, border_versions=GETI_VERSION_WITHOUT_CONTROLLER
            )
        )
