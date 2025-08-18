# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import pytest

from checks.dns import check_dns_ipv4_handling
from checks.errors import CheckSkipped, DNSCheckError
from configuration_models.install_config import InstallationConfig


def test_check_interface_ipv4_handling_with_existing_ipv4_interface(mocker):
    logger_mock = mocker.patch("logging.Logger.debug")
    config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    check_dns_ipv4_handling(config=config_mock)
    logger_mock.assert_any_call("DNS did resolve to example.com")


def test_check_interface_ipv4_handling_with_missing_ipv4_interface(mocker):
    get_ip = mocker.patch("socket.getaddrinfo")
    get_ip.return_value = None
    config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    with pytest.raises(DNSCheckError):
        check_dns_ipv4_handling(config=config_mock)


def test_check_interface_ipv4_handling_without_internet_access(mocker):
    get_ip = mocker.patch("socket.getaddrinfo")
    get_ip.return_value = None
    config_mock = InstallationConfig(interactive_mode=False, install_telemetry_stack=False)
    config_mock.internet_access.value = False

    with pytest.raises(CheckSkipped):
        check_dns_ipv4_handling(config=config_mock)
