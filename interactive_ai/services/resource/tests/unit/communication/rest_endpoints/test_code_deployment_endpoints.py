# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from http import HTTPStatus
from pathlib import Path
from tempfile import mkstemp
from unittest.mock import MagicMock, patch

import pytest

from communication.rest_controllers import DeploymentPackageRESTController

from geti_types import ID, ProjectIdentifier

DUMMY_PROJECT_ID = "234567890123456789010000"
DUMMY_WORKSPACE_ID = "567890123456789012340000"
DUMMY_ORGANIZATION_ID = "6682a33b-3d18-4dab-abee-f797090480e0"
API_BASE_PATTERN = (
    f"/api/v1/organizations/{DUMMY_ORGANIZATION_ID}/workspaces/{DUMMY_WORKSPACE_ID}/projects/{DUMMY_PROJECT_ID}"
)
API_DEPLOYMENT_PACKAGE_PATTERN = f"{API_BASE_PATTERN}/deployment_package"

DEPLOYMENT_PACKAGE_OVMS_REQUEST = {
    "package_type": "ovms",
    "models": [{"model_id": "6138af293b7b11505c43f7ef"}],
}
DEPLOYMENT_PACKAGE_CODE_REQUEST = {
    "package_type": "geti_sdk",
    "models": [{"model_id": "6138af293b7b11505c43f7ef"}],
}
DEPLOYMENT_PACKAGE_INVALID_TYPE_REQUEST = {
    "package_type": "invalid",
    "models": [{"model_id": "6138af293b7b11505c43f7ef"}],
}
DEPLOYMENT_PACKAGE_INVALID_BODY_REQUEST = {"a": 1}


class TestCodeDeploymentRESTEndpoint:
    @pytest.mark.parametrize(
        "request_json,expected_code",
        [
            (
                DEPLOYMENT_PACKAGE_OVMS_REQUEST,
                HTTPStatus.OK,
            ),
            (
                DEPLOYMENT_PACKAGE_CODE_REQUEST,
                HTTPStatus.OK,
            ),
            (DEPLOYMENT_PACKAGE_INVALID_TYPE_REQUEST, HTTPStatus.UNPROCESSABLE_ENTITY),
            (DEPLOYMENT_PACKAGE_INVALID_BODY_REQUEST, HTTPStatus.UNPROCESSABLE_ENTITY),
        ],
    )
    def test_download_deployment_package(self, fxt_resource_rest, request_json, expected_code) -> None:
        # Arrange
        endpoint = f"{API_DEPLOYMENT_PACKAGE_PATTERN}:download"
        project_identifier = ProjectIdentifier(
            workspace_id=ID(DUMMY_WORKSPACE_ID),
            project_id=ID(DUMMY_PROJECT_ID),
        )

        download_package_mock = MagicMock()
        _, filename = mkstemp()
        download_package_mock.return_value = Path(filename)

        # Act
        with patch.multiple(
            DeploymentPackageRESTController,
            download_ovms_package=download_package_mock,
            download_geti_sdk_package=download_package_mock,
        ):
            result = fxt_resource_rest.post(endpoint, json=request_json)

        # Assert
        if expected_code == HTTPStatus.OK:
            download_package_mock.assert_called_once_with(
                project_identifier=project_identifier,
                deployment_package_json=request_json,
            )

        assert result.status_code == expected_code
