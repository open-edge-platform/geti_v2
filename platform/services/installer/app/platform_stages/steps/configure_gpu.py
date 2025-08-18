# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import grp
import logging
import os.path
import re
import subprocess
import textwrap
from collections.abc import Callable

import kubernetes

from checks.resources import GPU_PROVIDER_NVIDIA
from cli_utils.platform_logs import subprocess_run
from configuration_models.install_config import InstallationConfig
from configuration_models.upgrade_config import UpgradeConfig
from constants.os import RENDER_GROUP
from constants.paths import (
    INSTALL_LOG_FILE_PATH,
    INTEL_DEVICE_PLUGIN_TEMPLATE_NAME,
    INTEL_DEVICE_PLUGIN_YAML_PATH,
    K3S_KUBECONFIG_PATH,
    NVIDIA_CONTAINER_RUNTIME_CONFIG_PATH,
    NVIDIA_DEVICE_PLUGIN_TEMPLATE_NAME,
    NVIDIA_DEVICE_PLUGIN_YAML_PATH,
)
from platform_stages.steps.errors import ConfigureGpuError
from platform_utils.helm import save_jinja_template
from platform_utils.kube_config_handler import KubernetesConfigHandler

logger = logging.getLogger(__name__)


def _label_gpu_node(node: kubernetes.client.V1Node, labels: dict, core_api: kubernetes.client.CoreV1Api) -> None:
    node_name: str = node.metadata.name
    node_labels: dict = node.metadata.labels or {}

    logger.info(
        f"Labeling node '{node_name}' with labels: " + ", ".join(f"{key}={value}" for key, value in labels.items())
    )
    try:
        if not all(node_labels.get(key) == value for key, value in labels.items()):
            patch = {"metadata": {"labels": labels}}
            core_api.patch_node(name=node_name, body=patch)
            logger.info("Node labeled.")
        else:
            logger.info("Node already labeled.")
    except kubernetes.client.exceptions.ApiException as err:
        logger.exception(err)
        raise ConfigureGpuError from err


def _modify_nvidia_container_runtime_config() -> None:
    regex_pattern = (
        r"^#?(accept-nvidia-visible-devices-envvar-when-unprivileged|"
        r"accept-nvidia-visible-devices-as-volume-mounts).*"
    )
    block = """
    accept-nvidia-visible-devices-as-volume-mounts = true
    accept-nvidia-visible-devices-envvar-when-unprivileged = false
    """

    logger.info("Modifying nvidia container runtime configuration...")
    try:
        # Read the original config
        with open(NVIDIA_CONTAINER_RUNTIME_CONFIG_PATH) as file:
            lines = file.readlines()

        # Write back after filtering out the unwanted lines using regex
        with open(NVIDIA_CONTAINER_RUNTIME_CONFIG_PATH, "w") as file:
            # Append the new configuration
            file.write(textwrap.dedent(block) + "\n")

            for line in lines:
                if not re.match(regex_pattern, line):
                    file.write(line)

        with open(INSTALL_LOG_FILE_PATH, "a", encoding="utf-8") as log_file:
            subprocess_run(
                ["systemctl", "restart", "k3s"],
                log_file,
            )
    except (OSError, subprocess.CalledProcessError) as err:
        logger.exception(err)
        raise ConfigureGpuError from err

    logger.info("Nvidia container runtime configuration modified.")


def _install_device_plugin_from_yaml(yaml_file: str) -> None:
    logger.info(f"Installing device plugin: '{os.path.basename(yaml_file)}'")
    try:
        with open(INSTALL_LOG_FILE_PATH, "a", encoding="utf-8") as log_file:
            subprocess_run(
                ["kubectl", f"--kubeconfig={K3S_KUBECONFIG_PATH}", "apply", "-f", yaml_file],
                log_file,
            )
    except subprocess.CalledProcessError as ex:
        raise ConfigureGpuError from ex
    logger.info("Device plugin installed.")


def _configure_gpu_for_provider(
    core_api: kubernetes.client.CoreV1Api,
    node: kubernetes.client.V1Node,
    label: dict | None,
    runtime_config_fn: Callable[[], None] | None,
    plugin_yaml: str,
) -> None:
    if runtime_config_fn:
        runtime_config_fn()

    if label:
        _label_gpu_node(node=node, labels=label, core_api=core_api)
    _install_device_plugin_from_yaml(yaml_file=plugin_yaml)


def _get_render_gid() -> int:
    group_info = grp.getgrnam(RENDER_GROUP)
    logger.debug(f"Render group id: {group_info.gr_gid}")
    return group_info.gr_gid


def configure_gpu(config: InstallationConfig | UpgradeConfig) -> None:
    """
    Configure GPU for installation purposes
    """

    data = {"registry": config.image_registry.value}
    if config.gpu_support.value:
        KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)

        with kubernetes.client.ApiClient() as api_client:
            core_api = kubernetes.client.CoreV1Api(api_client)
            try:
                control_plane_node = core_api.list_node(label_selector="node-role.kubernetes.io/control-plane").items[0]
            except kubernetes.client.exceptions.ApiException as err:
                logger.exception(err)
                raise ConfigureGpuError from err

            if config.gpu_provider.value == GPU_PROVIDER_NVIDIA:
                # NVIDIA configuration
                save_jinja_template(NVIDIA_DEVICE_PLUGIN_TEMPLATE_NAME, data, NVIDIA_DEVICE_PLUGIN_YAML_PATH)
                _configure_gpu_for_provider(
                    core_api=core_api,
                    node=control_plane_node,
                    label={"nvidia.com/gpu": "true"},
                    runtime_config_fn=_modify_nvidia_container_runtime_config,
                    plugin_yaml=NVIDIA_DEVICE_PLUGIN_YAML_PATH,
                )
            else:
                # INTEL configuration
                config.render_gid.value = _get_render_gid()  # needed to see xpu devices in training pod
                save_jinja_template(INTEL_DEVICE_PLUGIN_TEMPLATE_NAME, data, INTEL_DEVICE_PLUGIN_YAML_PATH)
                _configure_gpu_for_provider(
                    core_api=core_api,
                    node=control_plane_node,
                    label=None,  # we assume that for Intel cards we will have only one node (with gpu)
                    runtime_config_fn=None,
                    plugin_yaml=INTEL_DEVICE_PLUGIN_YAML_PATH,
                )
    else:
        logger.info("Skipping GPU configuration.")
