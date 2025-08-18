# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import subprocess
from unittest.mock import MagicMock

import pytest

from configuration_models.install_config import InstallationConfig
from configuration_models.upgrade_config import UpgradeConfig
from constants.paths import INSTALL_LOG_FILE_PATH, INTERNAL_REGISTRY_ADDRESS
from platform_stages.steps.errors import LoadImagesError, PinImageVersionError
from platform_stages.steps.load_images import _pin_images, load_images


def test_load_images_txt_file(mocker):
    mocker.patch("platform_stages.steps.load_images.glob.glob", return_value=["1.txt"])
    mocker.patch(
        "platform_stages.steps.load_images.subprocess_run",
        side_effect=subprocess.CalledProcessError(returncode=1, cmd="cmd"),
    )
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.lightweight_installer.value = False
    with pytest.raises(LoadImagesError):
        load_images(install_config_mock)


def test_load_images_tar_file(mocker):
    install_config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    install_config_mock.lightweight_installer.value = False
    mocker.patch("platform_stages.steps.load_images.glob.glob", return_value=["2.tar", "registry_2.8.3.5.tar"])
    mocker.patch("platform_stages.steps.load_images.subprocess_run")
    mocker.patch("platform_stages.steps.load_images.subprocess.run")
    load_images(install_config_mock)


def test_pin_images_success(mocker):
    mock_match = MagicMock()
    mock_match.group.return_value = "2.8.3.5"
    mocker.patch("platform_stages.steps.load_images.re.search", return_value=mock_match)

    mock_subprocess_run = mocker.patch(
        "platform_stages.steps.load_images.subprocess.run",
        return_value=MagicMock(returncode=0, stdout="127.0.0.1:30000/local-third-party/registry:2.8.3.5\n"),
    )

    list_of_images = ["/path/to/registry_2.8.3.5.tar"]
    config = UpgradeConfig(interactive_mode=False, install_telemetry_stack=False)

    try:
        with open(INSTALL_LOG_FILE_PATH, "a", encoding="utf-8") as log_file:
            _pin_images(list_of_images, config, log_file)
    except LoadImagesError:
        pytest.fail("LoadImagesError was raised unexpectedly!")

    mock_subprocess_run.assert_any_call(
        ["ctr", "-n", "k8s.io", "images", "ls", "-q"], capture_output=True, text=True, check=True
    )
    mock_subprocess_run.assert_any_call(
        [
            "ctr",
            "-n",
            "k8s.io",
            "images",
            "label",
            f"{INTERNAL_REGISTRY_ADDRESS}/local-third-party/registry:2.8.3.5",
            "io.cri-containerd.pinned=pinned",
        ],
        capture_output=True,
        text=True,
        check=True,
    )


def test_pin_images_version_extraction_failure(mocker):
    mocker.patch("platform_stages.steps.load_images.re.search", return_value=None)
    list_of_images = ["/path/to/registry_2.8.3.5.tar"]
    config = UpgradeConfig(interactive_mode=False, install_telemetry_stack=False)

    with pytest.raises(PinImageVersionError):
        with open(INSTALL_LOG_FILE_PATH, "a", encoding="utf-8") as log_file:
            _pin_images(list_of_images, config, log_file)
