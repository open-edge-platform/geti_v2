# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import logging
import re

from fastapi import HTTPException, status
from packaging.version import Version

from constants.platform import GETI_REGISTRY, PLATFORM_VERSION
from platform_operations.backup import _get_used_storage, is_backup_possible
from platform_operations.cluster import is_job_running
from platform_operations.version_change import commence_version_change
from rest.schema.upgrade import UpgradeRequest, UpgradeResponse
from routers import platform_router

logger = logging.getLogger(__name__)


@platform_router.post(
    path="/upgrade",
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_200_OK: {
            "description": "Upgrade process started successfully.",
            "content": {
                "application/json": {"example": UpgradeResponse(detail="Upgrade to version 2.12.0 has started.")}
            },
        },
        status.HTTP_400_BAD_REQUEST: {
            "description": "Not enough space to perform backup.",
            "content": {
                "application/json": {
                    "example": {"detail": "Not enough space to perform backup. Required: 10GB, Available: 5GB."}
                }
            },
        },
        status.HTTP_409_CONFLICT: {
            "description": "k3s or NVIDIA drivers are outdated.",
            "content": {
                "application/json": {
                    "example": {"detail": "k3s or NVIDIA drivers are outdated and need to be upgraded first."}
                }
            },
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Unexpected error occurred while starting the upgrade process.",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to start the upgrade process due to an internal error."}
                }
            },
        },
    },
)
def upgrade_platform(payload: UpgradeRequest) -> UpgradeResponse:
    """
    Starts the upgrade of the platform to the specified version.
    """
    logger.debug(f"POST upgrade request received. Payload: {payload}")
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

    current_version = Version(re.match(r"^\d+\.\d+\.\d+", PLATFORM_VERSION).group())
    selected_version = Version(re.match(r"^\d+\.\d+\.\d+", payload.version_number).group())
    if selected_version <= current_version:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Selected version: {payload.version_number} "
            f"is not higher than the current version {PLATFORM_VERSION}.",
        )

    if not payload.force_upgrade and not is_backup_possible():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Not enough space to perform backup. Required: {_get_used_storage()} MB",
        )

    if is_job_running():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upgrade is already in progress. Please wait until the current upgrade is completed.",
        )

    commence_version_change(
        source_version=str(current_version),
        target_version=str(selected_version),
        registry=GETI_REGISTRY,
        source_image_tag=PLATFORM_VERSION,
        target_image_tag=payload.version_number,
        manifest_version=payload.version_number,
        direction="upgrade",
    )

    logger.info(f"Upgrade to version {payload.version_number} has started.")
    return UpgradeResponse(detail=f"Upgrade to version {payload.version_number} has started.")
