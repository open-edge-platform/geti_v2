# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import logging
import socket

from checks.errors import CheckSkipped, DNSCheckError
from configuration_models.install_config import InstallationConfig
from configuration_models.upgrade_config import UpgradeConfig
from texts.checks import DNSChecksTexts

logger = logging.getLogger(__name__)


def check_dns_ipv4_handling(config: InstallationConfig | UpgradeConfig) -> None:
    """
    Check that platforms' DNS resolves the IPv4
    """
    if not config.internet_access.value:
        raise CheckSkipped
    try:
        logger.info("Checking IPv4 DNS resolve.")
        logger.debug("Resolving DNS to example.com")
        addr = socket.getaddrinfo("example.com", None, socket.AF_INET)
        if not addr:
            raise DNSCheckError(DNSChecksTexts.dns_ipv4_check_error)
        logger.debug("DNS did resolve to example.com")
    except socket.gaierror as error:
        raise DNSCheckError(DNSChecksTexts.dns_ipv4_check_error) from error
