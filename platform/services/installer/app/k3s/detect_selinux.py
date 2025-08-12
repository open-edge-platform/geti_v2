# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module responsible for detecting if SELinux is installed.
"""

import subprocess

from checks.os import _get_local_os
from cli_utils.platform_logs import subprocess_run
from constants.os import RequiredOS
from constants.paths import INSTALL_LOG_FILE_PATH


def is_selinux_installed() -> bool:
    """
    Verify if SELinux is installed on Red Hat machine.
    """
    local_os = _get_local_os()
    if RequiredOS.RHEL_9.value in local_os:
        with open(INSTALL_LOG_FILE_PATH, "a", encoding="utf-8") as log_file:
            try:
                subprocess_run(["sestatus"], log_file)
            except subprocess.CalledProcessError:
                return False  # not installed
        return True  # installed
    return False  # not rhel
