# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import logging
import time
import requests
from fastapi import BackgroundTasks, status
from platform_operations.cluster import is_job_running, load_kube_config, wait_for_job_creation, is_job_completed_or_failed
from rest.schema.check_installation_upgrade_progress import InstallationUpgradeProgressResponse, OperationStatus
from routers import platform_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
SERVICE_NAME = "install-upgrade"
NAMESPACE = "default"
MAX_RETRIES = 5
RETRY_INTERVAL = 5


class ProgressManager:
    def __init__(self):
        self.progress_data = InstallationUpgradeProgressResponse(
            progress_percentage=0,
            status=OperationStatus.NOT_RUNNING,
            message="Progress not started."
        )
        self.task_started = False

    def update_progress(self, data: dict) -> None:
        self.progress_data = InstallationUpgradeProgressResponse(**data)

    def get_progress(self) -> InstallationUpgradeProgressResponse:
        return self.progress_data


progress_manager = ProgressManager()


def call_progress_endpoint(progress_manager: ProgressManager) -> None:
    """Calls the GET /api/v1/platform/progress endpoint of the Geti installer job."""
    service_endpoint = f"http://{SERVICE_NAME}.{NAMESPACE}.svc.cluster.local:8000"
    logger.info(f"Calling progress endpoint at {service_endpoint}.")
    url = f"{service_endpoint}/api/v1/platform/progress"
    retries = 0
    while retries < MAX_RETRIES:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            logger.info(f"Received response: {response.json()}")
            progress_manager.update_progress(response.json())
            return
        except requests.exceptions.ConnectionError as e:
            logger.warning(f"Connection error (attempt {retries + 1}/{MAX_RETRIES}): {e}")
            retries += 1
            if retries < MAX_RETRIES:
                time.sleep(RETRY_INTERVAL)
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to call progress endpoint: {e}")
            retries += 1
            if retries < MAX_RETRIES:
                time.sleep(RETRY_INTERVAL)

    logger.error("Failed to retrieve progress after multiple attempts - endpoint may not be ready yet")
    # Don't mark as failed immediately, the job might still be starting up


def wait_for_service_ready(service_endpoint: str, timeout: int = 300, interval: int = 10) -> bool:
    """
    Wait for the service endpoint to be ready to accept requests.
    """
    logger.info(f"Waiting for service endpoint {service_endpoint} to be ready...")
    start_time = time.time()

    while time.time() - start_time < timeout:
        try:
            response = requests.get(f"{service_endpoint}/health", timeout=5)
            if response.status_code == 200:
                logger.info("Service endpoint is ready")
                return True
        except requests.exceptions.RequestException:
            pass

        try:
            response = requests.get(f"{service_endpoint}/api/v1/platform/progress", timeout=5)
            if response.status_code in [200, 404]:
                logger.info("Service endpoint is ready (via progress endpoint)")
                return True
        except requests.exceptions.RequestException:
            pass

        logger.debug(f"Service not ready yet, retrying in {interval} seconds...")
        time.sleep(interval)

    logger.warning(f"Service endpoint did not become ready within {timeout} seconds")
    return False


def periodic_progress_check(progress_manager: ProgressManager, job_name: str, interval: int = 10) -> None:
    """Periodically calls the progress endpoint."""
    logger.info("Starting periodic progress check.")
    service_endpoint = f"http://{SERVICE_NAME}.{NAMESPACE}.svc.cluster.local:8000"
    service_ready = False

    while True:
        is_finished, status_message = is_job_completed_or_failed(NAMESPACE, job_name)

        if is_finished:
            logger.info(f"Job finished: {status_message}")
            if "successfully" in status_message.lower():
                progress_manager.update_progress({
                    "progress_percentage": 100,
                    "status": OperationStatus.COMPLETED,
                    "message": "Installation/upgrade completed successfully."
                })
            else:
                progress_manager.update_progress({
                    "progress_percentage": 0,
                    "status": OperationStatus.FAILED,
                    "message": f"Installation/upgrade failed: {status_message}"
                })
            break

        if is_job_running(NAMESPACE, job_name):
            logger.info("Job is running")

            # Wait for service to be ready if not already checked
            if not service_ready:
                service_ready = wait_for_service_ready(service_endpoint, timeout=120, interval=5)
                if not service_ready:
                    logger.warning("Service endpoint not ready, will retry calling progress endpoint anyway")

            call_progress_endpoint(progress_manager)
        else:
            logger.info("Job is not running")
            progress_manager.update_progress({
                "progress_percentage": 0,
                "status": OperationStatus.NOT_RUNNING,
                "message": "Installation/upgrade job is not running."
            })
            break

        time.sleep(interval)


@platform_router.get(
    path="/check_installation_upgrade_progress",
    response_model=InstallationUpgradeProgressResponse,
    responses={
        status.HTTP_200_OK: {
            "description": "Successfully retrieved the installation/upgrade progress.",
            "content": {
                "application/json": {
                    "example": InstallationUpgradeProgressResponse(
                        progress_percentage=42,
                        status=OperationStatus.RUNNING,
                        message="Installation is in progress."
                    )
                }
            },
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Unexpected error occurred while checking progress.",
            "content": {
                "application/json": {"example": {"detail": "Failed to retrieve progress due to an internal error."}}
            },
        },
    },
)
def check_installation_upgrade_progress(background_tasks: BackgroundTasks) -> InstallationUpgradeProgressResponse:
    """Checks the progress of the current installation or upgrade process."""
    logger.info("GET check_installation_upgrade_progress request received.")
    load_kube_config()

    if not is_job_running(NAMESPACE, SERVICE_NAME):
        logger.info("Job not found, waiting for its creation.")
        wait_for_job_creation(NAMESPACE, SERVICE_NAME)

    if not progress_manager.task_started:
        background_tasks.add_task(periodic_progress_check, progress_manager, SERVICE_NAME)
        progress_manager.task_started = True

    return progress_manager.get_progress()
