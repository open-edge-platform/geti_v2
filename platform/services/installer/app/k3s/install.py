# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module responsible for K3S installation.
"""

import grp
import gzip
import logging
import os
import re
import shutil
import stat
import subprocess
import textwrap
import time
from typing import IO

import kubernetes
import requests
import yaml

from cli_utils.platform_logs import subprocess_run
from configuration_models.install_config import InstallationConfig
from constants.os import RENDER_GROUP
from constants.paths import (
    CONFIG_TOML_TMPL_PATH,
    INSTALL_LOG_FILE_PATH,
    K3S_AUDIT_LOG_PATH,
    K3S_IMAGES_DIR_PATH,
    K3S_INSTALL_LOG_FILE_PATH,
    K3S_INSTALLATION_MARK_FILEPATH,
    K3S_KUBECONFIG_PATH,
    K3S_OFFLINE_INSTALLATION_FILES_PATH,
    K3S_REMOTE_KUBECONFIG_PATH,
    K3S_SELINUX_OFFLINE_INSTALLATION_FILES_PATH,
    NVIDIA_CONTAINER_RUNTIME_CONFIG_PATH,
    USR_LOCAL_BIN_PATH,
)
from constants.platform import PLATFORM_NAMESPACE
from k3s.config import k3s_configuration
from k3s.detect_ip import get_first_public_ip
from k3s.detect_selinux import is_selinux_installed
from platform_utils.install_system_packages import install_packages_with_dnf
from platform_utils.kube_config_handler import KubernetesConfigHandler

logger = logging.getLogger(__name__)


class K3SInstallationError(Exception):
    """
    Raised when K3S installation script fails
    """


def _download_script(target_file: IO[bytes]):
    """
    Download K3S script to 'target_file' and make script executable.
    """
    script_addr = "https://get.k3s.io"
    logger.debug(f"Downloading K3S installation script from {script_addr}.")
    response = requests.get(script_addr)  # noqa: S113

    target_file.write(response.content)

    target_file_stat = os.stat(target_file.name)
    os.chmod(target_file.name, target_file_stat.st_mode | stat.S_IEXEC)


def _update_containerd_config(logs_file_path: str):
    """
    Update containerd config.toml.tmpl to point to 'current' location.
    """

    if not os.path.isfile(CONFIG_TOML_TMPL_PATH):
        logger.debug(f"Config file: '{CONFIG_TOML_TMPL_PATH}' not found, skipping.")
        return

    with open(CONFIG_TOML_TMPL_PATH) as config_toml_tmpl:
        content = config_toml_tmpl.read()

    # Replace k3s hashes with 'current' location link
    new_content = re.sub(r"[a-fA-F0-9]{64}", "current", content)

    # Skip if 'config.toml.tmpl' already uses 'current' location link
    if content == new_content:
        return

    try:
        with open(CONFIG_TOML_TMPL_PATH, "w") as config_toml_tmpl:
            config_toml_tmpl.write(new_content)
        logger.debug("'config.toml.tmpl' file updated successfully.")
    except (OSError, PermissionError) as error:
        logger.exception(f"Error occurred while updating the 'config.toml.tmpl' file: {str(error)}")
        raise K3SInstallationError from error

    with open(logs_file_path, "a", encoding="utf-8") as log_file:
        subprocess_run(command=["systemctl", "restart", "k3s"], log_file=log_file, env=os.environ.copy())


def _k3s_ready(time_wait: int = 300, delay: int = 10) -> bool:
    """
    Wait default 5 minutes for k3s node readiness
    """
    env = os.environ.copy()
    node_cmd = ["k3s", "kubectl", "get", "nodes"]

    for _ in range(0, time_wait, delay):
        try:
            result = subprocess.run(  # noqa: S603
                node_cmd,
                capture_output=True,
                text=True,
                timeout=5,
                check=False,
                env=env,
            )
            if "Ready" in result.stdout:
                return True
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            pass
        time.sleep(delay)
    return False


def _run_installer(k3s_script_path: str, logs_file_path: str):
    """
    Run K3S installer by running downloaded script in 'k3s_script_path' and writing
    execution logs to 'logs_dir'.
    """
    k3s_env_vars = k3s_configuration.to_env_var_dict()
    env = os.environ.copy()
    env.update(k3s_env_vars)

    os.makedirs(os.path.dirname(K3S_AUDIT_LOG_PATH), exist_ok=True)
    logger.debug(
        f"Running K3s installer with the configuration:\nINSTALL_K3S_VERSION: "
        f"{k3s_env_vars['INSTALL_K3S_VERSION']}, INSTALL_K3S_EXEC: {k3s_env_vars['INSTALL_K3S_EXEC']}."
    )

    with open(logs_file_path, "a", encoding="utf-8") as log_file:
        subprocess_run(k3s_script_path, log_file, env=env)

    if not _k3s_ready():
        raise K3SInstallationError("K3S failed to become ready within expected timeout")


def _mark_k3s_installation():
    """Creates a stub file in /etc/rancher/k3s directory to differentiate platform installer k3s installation"""
    with open(K3S_INSTALLATION_MARK_FILEPATH, "w") as stub_file:
        stub_file.write("")
        logger.debug(
            f"Created a stub file {K3S_INSTALLATION_MARK_FILEPATH} to differentiate platform installer "
            f"k3s installation."
        )


def _adjust_k3s_kubeconfig_server_address():
    """
    Make a copy of K3s installer kubeconfig and change server address in this copy to provided external address or
    first non-local IPv4 address found on local host.
    """
    logger.debug("Adjusting K3s kubeconfig server address.")

    first_nonlocal_host_ip = get_first_public_ip()
    if first_nonlocal_host_ip is None:
        logger.warning("Couldn't find any nonlocal host ip.")
        return
    external_address = first_nonlocal_host_ip

    shutil.copy2(K3S_KUBECONFIG_PATH, K3S_REMOTE_KUBECONFIG_PATH)
    logger.debug(f"Copied {K3S_KUBECONFIG_PATH} to {K3S_REMOTE_KUBECONFIG_PATH}.")

    with open(K3S_REMOTE_KUBECONFIG_PATH) as kubeconfig_file:
        kubeconfig = yaml.safe_load(kubeconfig_file)
    kubeconfig["clusters"][0]["cluster"]["server"] = f"https://{external_address}:6443"
    with open(K3S_REMOTE_KUBECONFIG_PATH, mode="w") as kubeconfig_file:
        yaml.dump(kubeconfig, kubeconfig_file)
        logger.debug(f"Server address in {K3S_REMOTE_KUBECONFIG_PATH} is set: {external_address}.")


def _set_default_namespace():
    """
    Set default namespace inside kubeconfig files to value defined inside PLATFORM_NAMESPACE constant
    """
    with open(K3S_REMOTE_KUBECONFIG_PATH) as kubeconfig_remote_file:
        kubeconfig_remote = yaml.safe_load(kubeconfig_remote_file)
    kubeconfig_remote["contexts"][0]["context"]["namespace"] = PLATFORM_NAMESPACE
    with open(K3S_REMOTE_KUBECONFIG_PATH, mode="w") as kubeconfig_remote_file:
        yaml.safe_dump(kubeconfig_remote, kubeconfig_remote_file)
        logger.debug(f"Namespace in {K3S_REMOTE_KUBECONFIG_PATH} is set to: {PLATFORM_NAMESPACE}.")


def _prepare_k3s_files_structure():
    """
    Prepare k3s files structure. Place binary and images in proper locations.
    """
    # Copy k3s binary
    shutil.copy2(f"{K3S_OFFLINE_INSTALLATION_FILES_PATH}/k3s", USR_LOCAL_BIN_PATH)

    # Copy k3s images
    os.makedirs(K3S_IMAGES_DIR_PATH, exist_ok=True)
    with (
        gzip.open(f"{K3S_OFFLINE_INSTALLATION_FILES_PATH}/k3s-airgap-images-amd64.tar.gz", "rb") as f_in,
        open(f"{K3S_IMAGES_DIR_PATH}/k3s-airgap-images-amd64.tar", "wb") as f_out,
    ):
        shutil.copyfileobj(f_in, f_out)

    # Set executable permissions
    if is_selinux_installed():
        with open(K3S_INSTALL_LOG_FILE_PATH, "a", encoding="utf-8") as log_file:
            subprocess_run(["chcon", "-t", "bin_t", f"{USR_LOCAL_BIN_PATH}/k3s"], log_file)
    os.chmod(f"{USR_LOCAL_BIN_PATH}/k3s", stat.S_IXUSR | stat.S_IRUSR | stat.S_IWUSR)
    os.chmod(f"{K3S_OFFLINE_INSTALLATION_FILES_PATH}/install.sh", stat.S_IXUSR | stat.S_IRUSR | stat.S_IWUSR)


def _install_k3s_selinux_rpm() -> None:
    if is_selinux_installed():
        install_packages_with_dnf(
            packages_path=K3S_SELINUX_OFFLINE_INSTALLATION_FILES_PATH,
            log_file_path=K3S_INSTALL_LOG_FILE_PATH,
            disable_repos=True,
        )


def _label_gpu_node(labels: dict) -> None:
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    with kubernetes.client.ApiClient() as api_client:
        core_api = kubernetes.client.CoreV1Api(api_client)
        try:
            node = core_api.list_node(label_selector="node-role.kubernetes.io/control-plane").items[0]
            node_name: str = node.metadata.name
            node_labels: dict = node.metadata.labels or {}
            logger.info(
                f"Labeling node '{node_name}' with labels: "
                + ", ".join(f"{key}={value}" for key, value in labels.items())
            )

            if not all(node_labels.get(key) == value for key, value in labels.items()):
                patch = {"metadata": {"labels": labels}}
                core_api.patch_node(name=node_name, body=patch)
                logger.info("Node labeled.")
            else:
                logger.info("Node already labeled.")
        except kubernetes.client.exceptions.ApiException as err:
            logger.exception(err)
            raise K3SInstallationError from err


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
        raise K3SInstallationError from err

    logger.info("Nvidia container runtime configuration modified.")


def _get_render_gid() -> int:
    group_info = grp.getgrnam(RENDER_GROUP)
    logger.debug(f"Render group id: {group_info.gr_gid}")
    return group_info.gr_gid


def install_k3s(  # noqa: ANN201
    config: InstallationConfig,
    logs_file_path: str = K3S_INSTALL_LOG_FILE_PATH,
    setup_remote_kubeconfig: bool = True,
):
    """
    Install K3S to current system. Write installation logs to 'logs_dir'. Use optionally 'external_address' to adjust
    produced kubeconfig.
    """
    try:
        k3s_script_path = f"{K3S_OFFLINE_INSTALLATION_FILES_PATH}/install.sh"
        _prepare_k3s_files_structure()
        _install_k3s_selinux_rpm()
        _run_installer(k3s_script_path=k3s_script_path, logs_file_path=logs_file_path)
        _update_containerd_config(logs_file_path=logs_file_path)
        _mark_k3s_installation()
        if config.gpu_support:
            if k3s_configuration.default_runtime == "nvidia":
                _modify_nvidia_container_runtime_config()
                _label_gpu_node(labels={"nvidia.com/gpu": "true"})
            else:
                # INTEL configuration
                config.render_gid.value = _get_render_gid()  # needed to see xpu devices in training pod
    except subprocess.CalledProcessError as ex:
        raise K3SInstallationError from ex

    if setup_remote_kubeconfig:
        _adjust_k3s_kubeconfig_server_address()
    _set_default_namespace()
