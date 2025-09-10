# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from collections.abc import Mapping, Sequence
from unittest.mock import MagicMock, Mock

import pytest
from install_data import get_first_nonlocal_host_ip_test_data
from kubernetes import client
from kubernetes.client import V1Node, V1NodeAddress, V1NodeList, V1NodeStatus, V1ObjectMeta

from k3s.detect_ip import get_first_public_ip, get_master_node_ip_address

FAKE_SERVER_IP = "10.12.4.18"


@pytest.mark.parametrize(["adapters_list", "expected_value"], get_first_nonlocal_host_ip_test_data)
def test_get_first_public_ip(mocker, adapters_list, expected_value):
    mocker.patch("ifaddr.get_adapters", return_value=adapters_list)
    host_ip = get_first_public_ip()

    assert host_ip == expected_value


@pytest.mark.parametrize(
    "result_expected,labels,address_types",
    (
        pytest.param(
            True,
            {"node-role.kubernetes.io/control-plane": "true", "beta.kubernetes.io/instance-type": "k3s"},
            ["InternalIP", "Hostname"],
            id="positive",
        ),
    ),
)
def test_get_master_node_ip_address(
    mocker, result_expected: bool, labels: Mapping[str, str], address_types: Sequence[str]
):
    patch_target = "k3s.detect_ip"

    mock_config = mocker.patch(f"{patch_target}.KubernetesConfigHandler")

    node_list_mock = _get_fake_node_list(labels=labels, address_types=address_types)

    mock_api_client = Mock(client.ApiClient)
    mock_api_client_init_ret = MagicMock()
    mock_api_client_init_ret.__enter__.side_effect = [mock_api_client]
    mock_api_client_type = mocker.patch(f"{patch_target}.client.ApiClient")
    mock_api_client_type.side_effect = [mock_api_client_init_ret]

    mock_apps_v1_api = MagicMock(client.CoreV1Api)
    mock_apps_v1_api.list_node.side_effect = [node_list_mock]
    mock_apps_v1_api_type = mocker.patch(f"{patch_target}.client.CoreV1Api")
    mock_apps_v1_api_type.side_effect = [mock_apps_v1_api]

    kubeconfig_path_mock = "path/kubeconfig"

    result_actual = get_master_node_ip_address(kubeconfig_path_mock)

    assert (result_actual == FAKE_SERVER_IP) == result_expected

    mock_config.assert_called_once_with(kube_config=kubeconfig_path_mock)
    mock_apps_v1_api_type.assert_called_once_with(mock_api_client)
    mock_apps_v1_api.list_node.assert_called_once()


def _get_fake_node_list(labels: Mapping[str, str], address_types: Sequence[str]) -> V1NodeList:
    items = []
    node_list = MagicMock(V1NodeList)

    metadata = Mock(V1ObjectMeta)
    metadata.labels = labels

    status = Mock(V1NodeStatus)
    addresses = []
    for a_type in address_types:
        tmp_address = Mock(V1NodeAddress)
        tmp_ip = FAKE_SERVER_IP
        if a_type != "InternalIP":
            tmp_ip.replace(".", "-")
        tmp_address.type = a_type
        tmp_address.address = tmp_ip
        addresses.append(tmp_address)

    status.addresses = addresses
    tmp_node = Mock(V1Node)
    tmp_node.metadata = metadata
    tmp_node.status = status

    items.append(tmp_node)

    node_list.items = items

    return node_list
