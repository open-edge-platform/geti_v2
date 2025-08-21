# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module containing check functions that are interacting with the Internet.
"""

import logging

import requests

from checks.errors import CheckSkipped
from configuration_models.install_config import InstallationConfig
from configuration_models.uninstall_config import UninstallationConfig
from configuration_models.upgrade_config import UpgradeConfig
from texts.checks import InternetConnectionChecksTexts

logger = logging.getLogger(__name__)


def check_internet_connection(config: InstallationConfig | UninstallationConfig | UpgradeConfig) -> None:
    """
    Check that internet is accessible.
    """

    try:
        logger.info("Checking Internet access.")
        logger.debug("Sending request to http://ghcr.io...")
        requests.head("http://ghcr.io", allow_redirects=False, timeout=10).raise_for_status()
        logger.debug("Internet is accessible.")
    except requests.RequestException as error:
        logger.debug("Internet is not accessible.")
        config.internet_access.value = False
        raise CheckSkipped(InternetConnectionChecksTexts.internet_connection_check_error) from error
