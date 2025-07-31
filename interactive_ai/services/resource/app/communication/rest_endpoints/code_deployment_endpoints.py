# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import logging
import pathlib
import shutil
from enum import Enum
from http import HTTPStatus
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from starlette.background import BackgroundTask
from starlette.responses import FileResponse, Response

from communication.rest_controllers.deployment_package_controller import DeploymentPackageRESTController

from geti_fastapi_tools.dependencies import get_project_identifier, get_request_json, setup_session_fastapi
from geti_types import ProjectIdentifier

logger = logging.getLogger(__name__)

api_project_pattern = "/api/v1/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}"

deployment_package_router = APIRouter(
    prefix=api_project_pattern,
    tags=["Deployment Package"],
    dependencies=[Depends(setup_session_fastapi)],
)


class DeploymentPackageType(Enum):
    OVMS = "ovms"
    GETI_SDK = "geti_sdk"


def _cleanup_deployment_package_from_temp(package_path: pathlib.Path) -> None:
    try:
        # First try to remove just the file
        package_path.unlink(missing_ok=True)

        # Then check if parent directory exists and is a directory before removing
        parent_dir = package_path.parent
        if parent_dir.exists() and parent_dir.is_dir():
            shutil.rmtree(parent_dir, ignore_errors=True)
    except Exception:
        logger.exception(f"Failed to cleanup deployment package temporary directory {package_path}")


@deployment_package_router.post("/deployment_package:download")
def download_deployment_package(
    request_json: Annotated[dict, Depends(get_request_json)],
    project_identifier: Annotated[ProjectIdentifier, Depends(get_project_identifier)],
) -> Response:
    """
    Download deployment package as zip file
    """
    deployment_package_json = {} if request_json is None else request_json
    package_path = None
    try:
        package_type = DeploymentPackageType(deployment_package_json["package_type"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
            detail=f"Missing package_type in request. Supported types are: {[t.value for t in DeploymentPackageType]}",
        )
    match package_type:
        case DeploymentPackageType.OVMS:
            package_path = DeploymentPackageRESTController.download_ovms_package(
                project_identifier=project_identifier, deployment_package_json=deployment_package_json
            )
        case DeploymentPackageType.GETI_SDK:
            package_path = DeploymentPackageRESTController.download_geti_sdk_package(
                project_identifier=project_identifier, deployment_package_json=deployment_package_json
            )

    return FileResponse(
        path=package_path,
        media_type="application/zip",
        filename=package_path.name,
        background=BackgroundTask(_cleanup_deployment_package_from_temp, package_path),
    )
