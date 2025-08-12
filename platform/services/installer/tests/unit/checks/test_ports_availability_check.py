# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import re
import socket

import pytest

from checks.errors import PortsAvailabilityCheckError
from checks.ports import DOCKER_REGISTRY_PORT, HTTP_PORT, UI_PORT, check_required_ports_availability, is_port_available


@pytest.fixture
def socket_connect_ex_mock(mocker):
    return mocker.patch("checks.ports.socket.socket.connect_ex")


@pytest.fixture
def is_port_available_mock(mocker):
    return mocker.patch("checks.ports.is_port_available")


def test_is_port_available_occupied_port(socket_connect_ex_mock):
    socket_connect_ex_mock.return_value = 0
    avail_port = 123
    result = is_port_available(avail_port)
    assert socket_connect_ex_mock.call_count == 1
    assert result is False


def test_is_port_available_free_port(socket_connect_ex_mock):
    socket_connect_ex_mock.return_value = 111
    occupied_port = 123
    result = is_port_available(occupied_port)
    assert socket_connect_ex_mock.call_count == 1
    assert result is True


def test_is_port_available_timeout(socket_connect_ex_mock):
    socket_connect_ex_mock.side_effect = socket.timeout
    occupied_port = 123
    with pytest.raises(PortsAvailabilityCheckError, match="Cannot check required ports."):
        is_port_available(occupied_port)
    assert socket_connect_ex_mock.call_count == 1


def test_check_required_ports_availability_occupied_ports(is_port_available_mock):
    is_port_available_mock.return_value = False
    ports_list = [HTTP_PORT, UI_PORT, DOCKER_REGISTRY_PORT]
    taken_ports = ", ".join(str(p) for p in ports_list)
    with pytest.raises(
        PortsAvailabilityCheckError,
        match=re.escape(
            f"It seems that port(s): {taken_ports} are already in use. Uninstall apps or services that use them."
        ),
    ):
        check_required_ports_availability()
    assert is_port_available_mock.call_count == 3


def test_check_required_ports_available_ports(is_port_available_mock):
    is_port_available_mock.return_value = True
    check_required_ports_availability()
    assert is_port_available_mock.call_count == 3
