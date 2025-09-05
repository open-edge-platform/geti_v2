# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import subprocess
from unittest.mock import MagicMock, mock_open, patch

import pytest
from jinja2 import TemplateError
from kubernetes import client

from platform_stages.steps.errors import ChartInstallationError, GenerateTemplateError
from platform_utils.helm import save_jinja_template, upsert_chart


@pytest.fixture
def mock_endpoint_ready():
    endpoint = client.V1Endpoints(subsets=[client.V1EndpointSubset(addresses=[client.V1EndpointAddress(ip="1.2.3.4")])])
    return endpoint


@pytest.fixture
def mock_subprocess_run():
    with patch("platform_utils.helm.subprocess_run") as mock:
        yield mock


@pytest.fixture
def core_api_mock(mocker):
    mocker.patch("platform_utils.k8s.KubernetesConfigHandler")
    mocker.patch("platform_utils.k8s.client", return_value=MagicMock())
    core_api_mock = mocker.patch("platform_utils.k8s.client.CoreV1Api").return_value
    return core_api_mock


# Test the upsert_chart function when endpoints are ready and subprocess_run succeeds
def test_upsert_chart_success(mocker, core_api_mock, mock_endpoint_ready, mock_subprocess_run):
    core_api_mock.read_namespaced_endpoints.return_value = mock_endpoint_ready
    mocker.patch("builtins.open")
    # Call the upsert_chart function
    upsert_chart(
        name="test-chart",
        namespace="test-namespace",
        chart_dir="/path/to/chart",
        values=["/path/to/values.yaml"],
        timeout="300s",
    )

    # Check that subprocess_run was called with the expected arguments
    mock_subprocess_run.assert_called_once()


# Test the upsert_chart function when endpoints are ready and subprocess_run fails
def test_upsert_chart_failure(mocker, core_api_mock, mock_endpoint_ready, mock_subprocess_run):
    core_api_mock.read_namespaced_endpoints.return_value = mock_endpoint_ready
    mock_subprocess_run.side_effect = subprocess.CalledProcessError(returncode=1, cmd="cmd")
    mocker.patch("builtins.open")
    mocker.patch("tenacity.nap.time.sleep")
    # Expect the ChartInstallationError to be raised when subprocess_run fails
    with pytest.raises(ChartInstallationError):
        upsert_chart(
            name="test-chart",
            namespace="test-namespace",
            chart_dir="/path/to/chart",
            values=["/path/to/values.yaml"],
            timeout="300s",
        )

    # Check that subprocess_run was called with the expected arguments
    assert mock_subprocess_run.call_count == 1


def test_save_jinja_template(mocker):
    mocker.patch("platform_utils.helm.Environment")
    mock_data = "mock file content"
    mocker.patch("builtins.open", mock_open(read_data=mock_data))
    save_jinja_template(source_file="fake.yaml.j2", destination_file="fake.yaml", data={})


def test_failed_jinja_template(mocker):
    mocker.patch("platform_utils.helm.Environment", side_effect=TemplateError)
    with pytest.raises(GenerateTemplateError):
        save_jinja_template(source_file="fake.yaml.j2", destination_file="fake.yaml", data={})
