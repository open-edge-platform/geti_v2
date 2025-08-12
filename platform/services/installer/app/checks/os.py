# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module containing check functions that are interacting with OS.
"""

import logging
import os
import subprocess
from subprocess import CalledProcessError, TimeoutExpired

from checks.errors import CheckSkipped, LocalOSCheckWarning
from configuration_models.install_config import InstallationConfig
from configuration_models.upgrade_config import UpgradeConfig
from constants.os import RequiredOS, SupportedOS
from texts.checks import LocalOSChecksTexts

logger = logging.getLogger(__name__)


def check_os_version(config: InstallationConfig | UpgradeConfig) -> None:
    """
    Check that OS version matches expected.
    """
    if os.environ.get("PLATFORM_CHECK_OS") == "false":
        logger.info("PLATFORM_CHECK_OS is set to false, skipping OS check.")
        raise CheckSkipped

    local_os = _get_local_os()
    pretty_required_os_list = ", ".join([item.value for item in RequiredOS])
    logger.debug(f"Local OS: {local_os}, required OS: {pretty_required_os_list}.")
    if any(
        item.value in local_os
        for item in (RequiredOS.UBUNTU_20, RequiredOS.UBUNTU_22, RequiredOS.UBUNTU_24, RequiredOS.UBUNTU_25_04)
    ):
        # default value already contain SupportedOS.UBUNTU.value
        pass
    elif RequiredOS.RHEL_9.value in local_os:
        config.local_os.value = SupportedOS.RHEL.value
    else:
        raise LocalOSCheckWarning(
            LocalOSChecksTexts.os_check_warning.format(local_os=local_os, supported_oses=pretty_required_os_list)
        )


def _get_local_os() -> str:
    """
    Attempt to get local OS description.
    """
    try:
        logger.debug("Checking OS version with `grep ^PRETTY /etc/os-release`")
        return (
            subprocess.check_output(["grep", "^PRETTY", "/etc/os-release"], timeout=5)  # noqa: S607
            .decode("utf-8")
            .strip()
            .replace("PRETTY_NAME=", "")
            .replace('"', "")
        )
    except (CalledProcessError, TimeoutExpired, FileNotFoundError):
        return LocalOSChecksTexts.unknown_os_name
