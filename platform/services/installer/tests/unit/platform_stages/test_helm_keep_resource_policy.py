# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from unittest.mock import MagicMock

import pytest

from configuration_models.upgrade_config import UpgradeConfig
from platform_stages.steps.apply_minor_version_changes.helm_keep_resource_policy import (
    K3S_KUBECONFIG_PATH,
    ResourceToHandle,
    add_helm_keep_resource_policy,
    add_remove_annotation,
    modify_helm_keep_resource_policy,
    remove_helm_keep_resource_policy,
    resource_exists,
)


@pytest.fixture
def upgrade_config():
    config = UpgradeConfig(interactive_mode=False, install_telemetry_stack=False)
    config.kube_config = MagicMock(value="/etc/rancher/k3s/k3s.yaml")
    return config


@pytest.fixture
def mock_subprocess(mocker):
    mock_subprocess = mocker.patch(
        "platform_stages.steps.apply_minor_version_changes.helm_keep_resource_policy.subprocess.run"
    )
    return mock_subprocess


@pytest.fixture
def mock_subprocess_run(mocker):
    mock_subprocess_run = mocker.patch(
        "platform_stages.steps.apply_minor_version_changes.helm_keep_resource_policy.subprocess_run"
    )
    return mock_subprocess_run


@pytest.fixture
def mock_open(mocker):
    mock_open = mocker.patch("platform_stages.steps.apply_minor_version_changes.helm_keep_resource_policy.open")
    return mock_open


def test_resource_exists(mock_subprocess):
    mock_subprocess.return_value.returncode = 0
    resource = ResourceToHandle(name="custom-tls", namespace="istio-system", type="secret")
    resource_exists(resource)
    assert mock_subprocess.call_count == 1

    mock_subprocess.return_value.returncode = 1
    assert mock_subprocess.call_count == 1


def test_add_remove_annotation(mock_open, mock_subprocess, mock_subprocess_run):
    resource = ResourceToHandle(name="custom-tls", namespace="istio-system", type="secret")

    add_remove_annotation(resource, "add")
    mock_subprocess_run.assert_called_with(
        [
            "kubectl",
            f"--kubeconfig={K3S_KUBECONFIG_PATH}",
            "annotate",
            "secret",
            "custom-tls",
            "-n",
            "istio-system",
            "helm.sh/resource-policy=keep",
        ],
        mock_open.return_value.__enter__.return_value,
    )

    add_remove_annotation(resource, "remove")
    mock_subprocess_run.assert_called_with(
        [
            "kubectl",
            f"--kubeconfig={K3S_KUBECONFIG_PATH}",
            "annotate",
            "secret",
            "custom-tls",
            "-n",
            "istio-system",
            "helm.sh/resource-policy-",
        ],
        mock_open.return_value.__enter__.return_value,
    )


def test_modify_helm_keep_resource_policy_invalid_version(
    mock_open, mock_subprocess, mock_subprocess_run, upgrade_config
):
    mock_subprocess.return_value.returncode = 0
    upgrade_config.current_platform_version.value = "1.9.0"
    modify_helm_keep_resource_policy(upgrade_config, "add")
    assert mock_subprocess.call_count == 2
    assert mock_subprocess_run.call_count == 2
    assert mock_open.call_count == 2


def test_modify_helm_keep_resource_policy_valid_version(
    mock_open, mock_subprocess, mock_subprocess_run, upgrade_config
):
    upgrade_config.current_platform_version.value = "2.0.1"
    mock_subprocess.return_value.returncode = 0

    modify_helm_keep_resource_policy(upgrade_config, "add")
    assert mock_subprocess.call_count == 4
    assert mock_subprocess_run.call_count == 4
    assert mock_open.call_count == 4


def test_add_helm_keep_resource_policy_valid_version(mock_open, mock_subprocess, mock_subprocess_run, upgrade_config):
    mock_subprocess.return_value.returncode = 0
    upgrade_config.current_platform_version.value = "2.3.4"
    add_helm_keep_resource_policy(upgrade_config)
    assert mock_subprocess.call_count == 4
    assert mock_subprocess_run.call_count == 4
    assert mock_open.call_count == 4


def test_remove_helm_keep_resource_policy_valid_version(
    mock_open, mock_subprocess, mock_subprocess_run, upgrade_config
):
    upgrade_config.current_platform_version.value = "2.3.4"
    mock_subprocess.return_value.returncode = 0
    remove_helm_keep_resource_policy(upgrade_config)
    assert mock_subprocess.call_count == 4
    assert mock_subprocess_run.call_count == 4
    assert mock_open.call_count == 4


def test_add_helm_keep_resource_policy_invalid_version(mock_open, mock_subprocess, mock_subprocess_run, upgrade_config):
    mock_subprocess.return_value.returncode = 0
    upgrade_config.current_platform_version.value = "1.9.0"
    add_helm_keep_resource_policy(upgrade_config)
    assert mock_subprocess.call_count == 2
    assert mock_subprocess_run.call_count == 2
    assert mock_open.call_count == 2


def test_remove_helm_keep_resource_policy_invalid_version(
    mock_open, mock_subprocess, mock_subprocess_run, upgrade_config
):
    upgrade_config.current_platform_version.value = "1.9.0"
    mock_subprocess.return_value.returncode = 0
    remove_helm_keep_resource_policy(upgrade_config)
    assert mock_subprocess.call_count == 2
    assert mock_subprocess_run.call_count == 2
    assert mock_open.call_count == 2
