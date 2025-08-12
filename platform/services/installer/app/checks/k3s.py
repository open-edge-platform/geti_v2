# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module containing check functions that are interacting with k3s.
"""

import logging
import os

from checks.errors import K3SCheckError
from constants import paths
from constants.paths import K3S_INSTALLATION_MARK_FILEPATH
from texts.checks import K3SChecksTexts

logger = logging.getLogger(__name__)


def check_if_k3s_installed_by_platform_installer():  # noqa: ANN201
    """Checks whether impt_k3s stub file exists in /etc/rancher/k3s directory"""

    logger.info("Checking if k3s was installed by platform installer.")
    logger.debug("Checking whether impt_k3s stub file exists in /etc/rancher/k3s directory...")
    if not os.path.exists(K3S_INSTALLATION_MARK_FILEPATH):
        raise K3SCheckError(K3SChecksTexts.check_k3s_installed_by_installer_error)
    logger.debug("impt_k3s stub file exists.")


def check_if_k3s_default_config_file_present():  # noqa: ANN201
    """Checks whether /etc/rancher/k3s/k3s.yaml exists"""

    logger.info("Checking if k3s default confir file exists.")
    logger.debug("Checking whether /etc/rancher/k3s/k3s.yaml exists...")
    if not os.path.exists(paths.K3S_KUBECONFIG_PATH):
        raise K3SCheckError(K3SChecksTexts.check_k3s_default_config_exists_error)
    logger.debug("/etc/rancher/k3s/k3s.yaml exists.")
