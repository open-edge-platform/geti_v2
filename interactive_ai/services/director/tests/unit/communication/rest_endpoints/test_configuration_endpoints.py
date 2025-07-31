# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import json
from http import HTTPStatus
from unittest.mock import patch

import pytest
from testfixtures import compare

from communication.controllers.configuration_controller import ConfigurationRESTController

from geti_types import ID

DUMMY_USER = ID("dummy_user")
DUMMY_ORGANIZATION_ID = "6682a33b-3d18-4dab-abee-f797090480e0"
DUMMY_WORKSPACE_ID = "567890123456789012340000"
DUMMY_PROJECT_ID = "234567890123456789010000"
DUMMY_TASK_ID = "42d31793d5f1fb7e6efa6642"
DUMMY_DATA = {"dummy_key": "dummy_value"}
API_PROJECT_PATTERN = (
    f"/api/v1/organizations/{DUMMY_ORGANIZATION_ID}/workspaces/{DUMMY_WORKSPACE_ID}/projects/{DUMMY_PROJECT_ID}"
)
API_CONFIGURATION_PATTERN = f"{API_PROJECT_PATTERN}/configuration"


class TestConfigurationRESTEndpoint:
    def test_set_task_chain_configuration_endpoint_error_handling(self, fxt_director_app) -> None:
        # Arrange
        endpoint = f"{API_CONFIGURATION_PATTERN}/task_chain"
        request_body: dict = {}

        # Act and Assert
        result = fxt_director_app.post(endpoint, json=request_body)

        assert result.status_code == 400

    def test_task_chain_configuration_endpoint_get(self, fxt_director_app) -> None:
        # Arrange
        endpoint = f"{API_CONFIGURATION_PATTERN}/task_chain"

        # Act
        with patch.object(
            ConfigurationRESTController,
            "get_task_chain_configuration",
            return_value=DUMMY_DATA,
        ) as mock_get_task_chain_config:
            result = fxt_director_app.get(endpoint)

        # Assert
        mock_get_task_chain_config.assert_called_once_with(
            workspace_id=ID(DUMMY_WORKSPACE_ID),
            project_id=ID(DUMMY_PROJECT_ID),
        )
        assert result.status_code == HTTPStatus.OK
        compare(json.loads(result.content), DUMMY_DATA, ignore_eq=True)

    def test_task_chain_configuration_endpoint_post(self, fxt_director_app) -> None:
        # Arrange
        endpoint = f"{API_CONFIGURATION_PATTERN}/task_chain"
        request_data: dict = {}

        # Act
        with patch.object(
            ConfigurationRESTController,
            "validate_and_set_task_chain_configuration",
            return_value=DUMMY_DATA,
        ) as mock_validate_and_set_task_chain_config:
            result = fxt_director_app.post(endpoint, json=request_data)

        # Assert
        mock_validate_and_set_task_chain_config.assert_called_once_with(
            workspace_id=ID(DUMMY_WORKSPACE_ID),
            project_id=ID(DUMMY_PROJECT_ID),
            set_request=request_data,
        )
        assert result.status_code == HTTPStatus.OK
        compare(json.loads(result.content), DUMMY_DATA, ignore_eq=True)

    def test_set_global_configuration_endpoint_error_handling(self, fxt_director_app) -> None:
        # Arrange
        endpoint = f"{API_CONFIGURATION_PATTERN}/global"
        request_body: dict = {}

        # Act
        result = fxt_director_app.post(endpoint, json=request_body)

        # Assert
        assert result.status_code == 400

    def test_global_configuration_endpoint_get(self, fxt_director_app) -> None:
        # Arrange
        endpoint = f"{API_CONFIGURATION_PATTERN}/global"

        # Act
        with patch.object(
            ConfigurationRESTController,
            "get_global_configuration",
            return_value=DUMMY_DATA,
        ) as mock_get_global_config:
            result = fxt_director_app.get(endpoint)

        # Assert
        mock_get_global_config.assert_called_once_with(
            workspace_id=ID(DUMMY_WORKSPACE_ID),
            project_id=ID(DUMMY_PROJECT_ID),
        )
        assert result.status_code == HTTPStatus.OK
        compare(json.loads(result.content), DUMMY_DATA, ignore_eq=True)

    def test_global_configuration_endpoint_post(self, fxt_director_app) -> None:
        # Arrange
        endpoint = f"{API_CONFIGURATION_PATTERN}/global"
        request_data: dict = {}

        # Act
        with patch.object(
            ConfigurationRESTController,
            "validate_and_set_global_configuration",
            return_value=DUMMY_DATA,
        ) as mock_validate_and_set_global_config:
            result = fxt_director_app.post(endpoint, json=request_data)

        # Assert
        mock_validate_and_set_global_config.assert_called_once_with(
            workspace_id=ID(DUMMY_WORKSPACE_ID),
            project_id=ID(DUMMY_PROJECT_ID),
            set_request=request_data,
        )
        assert result.status_code == HTTPStatus.OK
        compare(json.loads(result.content), DUMMY_DATA, ignore_eq=True)

    def test_full_configuration_endpoint_get(self, fxt_director_app) -> None:
        # Arrange
        endpoint = API_CONFIGURATION_PATTERN

        # Act
        with patch.object(
            ConfigurationRESTController,
            "get_full_configuration",
            return_value=DUMMY_DATA,
        ) as mock_get_full_config:
            result = fxt_director_app.get(endpoint)

        # Assert
        mock_get_full_config.assert_called_once_with(
            workspace_id=ID(DUMMY_WORKSPACE_ID),
            project_id=ID(DUMMY_PROJECT_ID),
        )
        assert result.status_code == HTTPStatus.OK
        compare(json.loads(result.content), DUMMY_DATA, ignore_eq=True)

    def test_full_configuration_endpoint_post(self, fxt_director_app) -> None:
        # Arrange
        endpoint = API_CONFIGURATION_PATTERN
        request_data: dict = {}

        # Act
        with patch.object(
            ConfigurationRESTController,
            "set_full_configuration",
            return_value=DUMMY_DATA,
        ) as mock_set_full_config:
            result = fxt_director_app.post(endpoint, json=request_data)

        # Assert
        mock_set_full_config.assert_called_once_with(
            workspace_id=ID(DUMMY_WORKSPACE_ID),
            project_id=ID(DUMMY_PROJECT_ID),
            set_request=request_data,
        )
        assert result.status_code == HTTPStatus.OK
        compare(json.loads(result.content), DUMMY_DATA, ignore_eq=True)

    def test_task_configuration_endpoint_get(self, fxt_director_app) -> None:
        # Arrange
        dummy_model_id = "dummy_model_id"
        dummy_algorithm = "dummy_algo"
        endpoint = (
            f"{API_CONFIGURATION_PATTERN}/task_chain/{DUMMY_TASK_ID}"
            f"?model_id={dummy_model_id}&algorithm_name={dummy_algorithm}"
        )

        # Act
        with patch.object(
            ConfigurationRESTController,
            "get_task_or_model_configuration",
            return_value=DUMMY_DATA,
        ) as mock_get_task_or_model_config:
            result = fxt_director_app.get(endpoint)

        # Assert
        mock_get_task_or_model_config.assert_called_once_with(
            workspace_id=ID(DUMMY_WORKSPACE_ID),
            project_id=ID(DUMMY_PROJECT_ID),
            task_id=ID(DUMMY_TASK_ID),
            model_id=dummy_model_id,
            algorithm_name=dummy_algorithm,
        )
        assert result.status_code == HTTPStatus.OK
        compare(json.loads(result.content), DUMMY_DATA, ignore_eq=True)

    def test_task_configuration_endpoint_post(self, fxt_director_app) -> None:
        # Arrange
        endpoint = f"{API_CONFIGURATION_PATTERN}/task_chain/{DUMMY_TASK_ID}"
        request_data: dict = {}

        # Act
        with patch.object(
            ConfigurationRESTController,
            "set_task_configuration",
            return_value=DUMMY_DATA,
        ) as mock_set_task_or_model_config:
            result = fxt_director_app.post(endpoint, json=request_data)

        # Assert
        mock_set_task_or_model_config.assert_called_once_with(
            workspace_id=ID(DUMMY_WORKSPACE_ID),
            project_id=ID(DUMMY_PROJECT_ID),
            task_id=ID(DUMMY_TASK_ID),
            set_request=request_data,
        )
        assert result.status_code == HTTPStatus.OK
        compare(json.loads(result.content), DUMMY_DATA, ignore_eq=True)

    @pytest.mark.parametrize(
        "endpoint, method, mock_function",
        [
            # Full configuration endpoints
            (
                API_CONFIGURATION_PATTERN,
                "get",
                "get_full_configuration",
            ),
            (
                API_CONFIGURATION_PATTERN,
                "post",
                "set_full_configuration",
            ),
            # Global configuration endpoints
            (
                f"{API_CONFIGURATION_PATTERN}/global",
                "get",
                "get_global_configuration",
            ),
            (
                f"{API_CONFIGURATION_PATTERN}/global",
                "post",
                "validate_and_set_global_configuration",
            ),
            # Task chain configuration endpoints
            (
                f"{API_CONFIGURATION_PATTERN}/task_chain",
                "get",
                "get_task_chain_configuration",
            ),
            (
                f"{API_CONFIGURATION_PATTERN}/task_chain",
                "post",
                "validate_and_set_task_chain_configuration",
            ),
            # Task configuration endpoints
            (
                f"{API_CONFIGURATION_PATTERN}/task_chain/{DUMMY_TASK_ID}",
                "get",
                "get_task_or_model_configuration",
            ),
            (
                f"{API_CONFIGURATION_PATTERN}/task_chain/{DUMMY_TASK_ID}",
                "post",
                "set_task_configuration",
            ),
        ],
    )
    def test_sunset_headers_are_present(self, fxt_director_app, endpoint, method, mock_function) -> None:
        """Test that sunset headers are present on all deprecated endpoints."""
        # Arrange
        request_data = {"dummy_response": "data"}

        # Act
        with patch.object(
            ConfigurationRESTController,
            mock_function,
            return_value=DUMMY_DATA,
        ):
            if method == "get":
                result = fxt_director_app.get(endpoint)
            else:  # post
                result = fxt_director_app.post(endpoint, json=request_data)

        # Assert
        assert result.status_code == HTTPStatus.OK, f"Failed for {method.upper()} {endpoint}"
        assert "Sunset" in result.headers, f"Missing Sunset header for {method.upper()} {endpoint}"
        assert "Deprecation" in result.headers, f"Missing Deprecation header for {method.upper()} {endpoint}"
        assert "Link" in result.headers, f"Missing Link header for {method.upper()} {endpoint}"

        # Check header values
        assert result.headers["Sunset"] == "Fri, 31 Oct 2025 23:59:59 GMT"
        assert result.headers["Deprecation"] == "1754006400"  # unix timestamp
        assert 'rel="deprecation-info"' in result.headers["Link"]
