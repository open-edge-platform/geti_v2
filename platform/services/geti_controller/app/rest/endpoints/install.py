# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import logging

from fastapi import HTTPException, status

from constants.platform import GETI_REGISTRY, INSTALL_VERSION
from platform_operations.cluster import check_config_map_exists, deploy_service_job, load_kube_config
from rest.schema.install import InstallRequest, InstallResponse
from routers import platform_router

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@platform_router.post(
    path="/install",
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_200_OK: {
            "description": "Installation process started successfully.",
            "content": {
                "application/json": {"example": InstallResponse(detail="Installation of version 2.9.0 has started.")}
            },
        },
        status.HTTP_400_BAD_REQUEST: {
            "description": "Invalid request or installation cannot be started.",
            "content": {"application/json": {"example": {"detail": "Version number is required."}}},
        },
        status.HTTP_409_CONFLICT: {
            "description": "Platform is already installed or conflicting state detected.",
            "content": {"application/json": {"example": {"detail": "Platform is already installed."}}},
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Unexpected error occurred while starting the installation process.",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to start the installation process due to an internal error."}
                }
            },
        },
    },
)
def install_platform(payload: InstallRequest) -> InstallResponse:
    """
    Starts the installation of the specified platform version.
    """
    logger.debug(f"POST install request received. Payload: {payload}")

    if not payload.version_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Version number is required.",
        )

    if payload.version_number == "invalid_version":  # TODO validation
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid version number provided.",
        )

    load_kube_config()
    if check_config_map_exists(name="impt-configuration", namespace="impt"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Platform is already installed.")

    deploy_service_job(registry=GETI_REGISTRY, image_tag=INSTALL_VERSION, manifest_version=INSTALL_VERSION)

    logger.info(f"Installation of version {payload.version_number} has started.")
    return InstallResponse(detail=f"Installation of version {payload.version_number} has started.")
