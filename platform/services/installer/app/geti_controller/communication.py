# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import logging
import subprocess
import time
from dataclasses import dataclass
from enum import Enum
from http import HTTPStatus

import requests

from constants.platform import (
    GPU_PROVIDER_INTEL_ARC,
    GPU_PROVIDER_INTEL_MAX,
    GPU_PROVIDER_NVIDIA,
)
from geti_controller.constants import GETI_CONTROLLER_NAMESPACE, LOCAL_PORT, SERVICE_NAME, SERVICE_PORT
from geti_controller.errors import GetiControllerCommunicationError
from platform_configuration.versions import get_target_product_build
from platform_utils.k8s import is_service_ready

logger = logging.getLogger(__name__)


class OperationStatus(str, Enum):
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    ROLLING_BACK = "ROLLING_BACK"
    NOT_RUNNING = "NOT_RUNNING"


@dataclass
class InstallationStatus:
    status: str
    progress: int
    message: str


def establish_port_forwarding(kube_config: str) -> subprocess.Popen:
    """
    Establishes port-forwarding to the Geti Controller service.
    """
    if not is_service_ready(service_name=SERVICE_NAME, namespace=GETI_CONTROLLER_NAMESPACE):
        logger.error(f"{SERVICE_NAME} service is not ready for port-forwarding.")
        raise GetiControllerCommunicationError("Service is not ready for port-forwarding.")

    port_forward_cmd = [
        "kubectl",
        "--kubeconfig",
        kube_config,
        "port-forward",
        f"svc/{SERVICE_NAME}",
        f"{LOCAL_PORT}:{SERVICE_PORT}",
        "--namespace",
        GETI_CONTROLLER_NAMESPACE,
    ]
    process = subprocess.Popen(port_forward_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)  # noqa: S603
    time.sleep(3)  # wait for port-forwarding to start
    return process


def call_install_endpoint(kube_config: str, render_gid: int, gpu_provider: str | None = None) -> dict:
    """
    Calls the POST /api/v1/platform/install endpoint of the Geti Controller service
    with port-forwarding.

    Raises:
        GetiControllerCommunicationError: If the response status code is not 200.
    """
    process = establish_port_forwarding(kube_config)

    try:
        url = f"http://localhost:{LOCAL_PORT}/api/v1/platform/install"
        payload = {"version_number": get_target_product_build()}
        if gpu_provider:
            if gpu_provider == GPU_PROVIDER_NVIDIA:
                gpu_label = "nvidia.com/gpu"
            elif gpu_provider in (GPU_PROVIDER_INTEL_ARC, GPU_PROVIDER_INTEL_MAX):
                gpu_label = "gpu.intel.com/i915"
            else:
                gpu_label = "gpu.intel.com/xe"

            payload["gpu_label"] = gpu_label
            payload["render_gid"] = str(render_gid)
        response = requests.post(url, json=payload, timeout=10)

        if response.status_code != HTTPStatus.OK:
            raise GetiControllerCommunicationError(
                f"Error calling install endpoint: {response.status_code} - {response.text}"
            )
        return response.json()
    except requests.RequestException as e:
        raise GetiControllerCommunicationError(f"Installation request failed: {e}")
    finally:
        process.terminate()
        process.wait()


def get_installation_status_via_existing_port_forward() -> InstallationStatus:
    """
    Fetch the installation progress and status from the Geti Controller endpoint.

    Returns:
        InstallationStatus: An object containing progress percentage, status, and message.
    """
    try:
        url = f"http://localhost:{LOCAL_PORT}/api/v1/platform/check_installation_upgrade_progress"
        response = requests.get(url, timeout=10)
        data = response.json()
        return InstallationStatus(
            progress=data.get("progress_percentage", 0),
            status=data.get("status", ""),
            message=data.get("message", ""),
        )
    except requests.RequestException as e:
        raise GetiControllerCommunicationError(f"Failed to fetch installation status: {e}")
