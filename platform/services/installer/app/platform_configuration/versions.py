# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
"""Module used to retrieve platform versions"""

import yaml
from kubernetes import client as kube_client
from kubernetes.client.rest import ApiException

from constants.paths import VERSION_YAML_PATH
from constants.platform import PLATFORM_NAMESPACE
from platform_utils.kube_config_handler import KubernetesConfigHandler


def get_current_platform_version(kubeconfig_path: str) -> str:
    """Retrieves current platform version from the impt-versions configmap"""
    KubernetesConfigHandler(kube_config=kubeconfig_path)
    try:
        with kube_client.ApiClient() as client:
            core_api = kube_client.CoreV1Api(client)
            result = core_api.read_namespaced_config_map(f"{PLATFORM_NAMESPACE}-versions", PLATFORM_NAMESPACE)
        return result.data["platformVersion"]
    except ApiException:
        return "unknown version"


def get_target_platform_version() -> str:
    """Retrieves target platform version of the running installer from the config file"""
    with open(VERSION_YAML_PATH) as yaml_file:
        return yaml.safe_load(yaml_file)["product_version"]


def get_target_product_build() -> str:
    """Retrieves target build version of the running installer from the config file"""
    with open(VERSION_YAML_PATH) as yaml_file:
        return yaml.safe_load(yaml_file)["product_build"]
