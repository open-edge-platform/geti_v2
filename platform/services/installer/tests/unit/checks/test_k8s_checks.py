# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import re
from ssl import SSLError
from unittest.mock import MagicMock, Mock

import pytest

from checks import k8s
from checks.errors import CheckSkipped, K8SCheckError, K8SCheckWarning
from checks.k8s import (
    ISTIO_GATEWAY_CRD_NAME,
    K8S_API_SERVER_PORT,
    ApiException,
    ClusterCapacity,
    K8SChecksTexts,
    _check_ingress_gateway_service_ip,
    _check_istio_gateway_crd,
    _get_running_ingress_gateway_pod,
    check_istio_ingress_gateway_installation,
    check_istio_ingress_gateway_version,
    check_k8s_cluster_version,
    check_k8s_connection,
    check_k8s_cpu_requirements,
    check_k8s_gpu_requirements,
    check_k8s_is_not_installed,
    check_k8s_memory_requirements,
    check_metrics_server_installed,
    check_metrics_server_version,
)
from configuration_models.upgrade_config import UpgradeConfig


@pytest.fixture
def core_api_mock(mocker):
    mocker.patch("checks.k8s.KubernetesConfigHandler")
    mocker.patch("checks.k8s.kube_client.ApiClient", return_value=MagicMock())
    core_api_mock = mocker.patch("checks.k8s.kube_client.CoreV1Api").return_value
    return core_api_mock


@pytest.fixture
def custom_api_mock(mocker):
    mocker.patch("checks.k8s.KubernetesConfigHandler")
    mocker.patch("checks.k8s.kube_client.ApiClient", return_value=MagicMock())
    custom_api_mock = mocker.patch("checks.k8s.kube_client.CustomObjectsApi").return_value
    return custom_api_mock


@pytest.fixture
def version_api_mock(mocker):
    mocker.patch("checks.k8s.KubernetesConfigHandler")
    mocker.patch("checks.k8s.kube_client.ApiClient")
    version_api_mock = mocker.patch("checks.k8s.kube_client.VersionApi").return_value
    return version_api_mock


def test_check_k8s_connection(core_api_mock):
    kubeconfig_path = "fake-path.yaml"
    check_k8s_connection(kubeconfig_path=kubeconfig_path)

    assert core_api_mock.list_namespace.call_count == 1


def test_check_k8s_connection_timeout(core_api_mock):
    core_api_mock.list_namespace.side_effect = ConnectionRefusedError
    kubeconfig_path = "fake-path.yaml"
    with pytest.raises(K8SCheckError):
        check_k8s_connection(kubeconfig_path=kubeconfig_path)

    assert core_api_mock.list_namespace.call_count == 1


def test_check_k8s_connection_error(core_api_mock):
    core_api_mock.list_namespace.side_effect = SSLError
    kubeconfig_path = "fake-path.yaml"
    with pytest.raises(K8SCheckError):
        check_k8s_connection(kubeconfig_path=kubeconfig_path)

    assert core_api_mock.list_namespace.call_count == 1


def test_check_k8s_is_already_installed_not_installed(mocker):
    is_port_available_mock = mocker.patch("checks.k8s.is_port_available")
    is_port_available_mock.return_value = True
    check_k8s_is_not_installed()
    assert is_port_available_mock.call_count == 1


def test_check_k8s_is_already_installed_exception(mocker):
    is_port_available_mock = mocker.patch("checks.k8s.is_port_available")
    is_port_available_mock.return_value = False
    with pytest.raises(
        K8SCheckError,
        match=re.escape(
            f"Port {K8S_API_SERVER_PORT} is in use. It seems Kubernetes is already installed on this machine."
        ),
    ):
        check_k8s_is_not_installed()
    assert is_port_available_mock.call_count == 1


@pytest.mark.parametrize(["requirement", "capacity"], [(50, 62), (50, 50), (50, 40)])
def test_check_k8s_cpu_requirements(mocker, monkeypatch, requirement: int, capacity: int):
    get_cluster_resource_capacity_mock: Mock = mocker.patch("checks.k8s.get_cluster_resource_capacity")
    monkeypatch.setenv("PLATFORM_CPU_CORES_MIN", str(requirement))

    get_cluster_resource_capacity_mock.return_value = ClusterCapacity(
        cpu_capacity=[capacity * 1000], memory_capacity=[], gpu_capacity=[]
    )

    kubeconfig_path = "fake-path.yaml"
    if capacity >= requirement:
        check_k8s_cpu_requirements(kubeconfig_path=kubeconfig_path)
    else:
        with pytest.raises(K8SCheckError):
            check_k8s_cpu_requirements(kubeconfig_path=kubeconfig_path)

    get_cluster_resource_capacity_mock.assert_called_once_with(kubeconfig_path=kubeconfig_path)


@pytest.mark.parametrize(["requirement", "capacity"], [(200, 220), (200, 200), (64, 80)])
def test_check_k8s_mem_requirements(mocker, monkeypatch, requirement: int, capacity: int):
    get_cluster_resource_capacity_mock: Mock = mocker.patch("checks.k8s.get_cluster_resource_capacity")
    monkeypatch.setenv("PLATFORM_MEMORY_MIN", f"{requirement}G")

    get_cluster_resource_capacity_mock.return_value = ClusterCapacity(
        cpu_capacity=[], memory_capacity=[capacity * (1024**2)], gpu_capacity=[]
    )

    kubeconfig_path = "fake-path.yaml"
    if capacity >= requirement:
        check_k8s_memory_requirements(kubeconfig_path=kubeconfig_path)
    else:
        with pytest.raises(K8SCheckError):
            check_k8s_memory_requirements(kubeconfig_path=kubeconfig_path)

    get_cluster_resource_capacity_mock.assert_called_once_with(kubeconfig_path=kubeconfig_path)


@pytest.mark.parametrize(["gpu_support", "capacity"], [(True, 4), (False, 2), (True, 0)])
def test_check_k8s_gpu_requirements(mocker, gpu_support: bool, capacity: int):
    get_cluster_resource_capacity_mock: Mock = mocker.patch("checks.k8s.get_cluster_resource_capacity")
    get_gpu_node_label_mock: Mock = mocker.patch("checks.k8s.get_gpu_node_label")

    get_cluster_resource_capacity_mock.return_value = ClusterCapacity(
        cpu_capacity=[], memory_capacity=[], gpu_capacity=[capacity]
    )
    get_gpu_node_label_mock.return_value = "nvidia.com/gpu"

    config_mock = UpgradeConfig(interactive_mode=False, install_telemetry_stack=False)
    config_mock.gpu_support.value = gpu_support
    config_mock.kube_config.value = "fake-path.yaml"
    if not gpu_support:
        with pytest.raises(CheckSkipped):
            check_k8s_gpu_requirements(config_mock)
    elif capacity <= 0:
        with pytest.raises(K8SCheckWarning):
            check_k8s_gpu_requirements(config_mock)
            get_cluster_resource_capacity_mock.assert_called_once_with(kubeconfig_path=config_mock.kube_config.value)
    else:
        check_k8s_gpu_requirements(config_mock)
        get_cluster_resource_capacity_mock.assert_called_once_with(kubeconfig_path=config_mock.kube_config.value)
        assert config_mock.gpu_provider.value == "nvidia"


@pytest.mark.parametrize("k8s_cluster_version", ["v1.25.4", "v1.25.4+k3s1"])
def test_check_cluster_version(version_api_mock, mocker, k8s_cluster_version):
    version_object = MagicMock()
    version_object.git_version = k8s_cluster_version
    version_api_mock.get_code.return_value = version_object
    kubeconfig_path = "fake-path.yaml"
    check_k8s_cluster_version(kubeconfig_path=kubeconfig_path)

    assert version_api_mock.get_code.call_count == 1


@pytest.mark.parametrize(
    "k8s_cluster_version", ["v1.12.3", "v1.24.5+k3s1", "v1.24.15+microk8s", "v12.24.5_lorem", "v2.22"]
)
def test_check_cluster_version_fail(version_api_mock, k8s_cluster_version):
    version_object = MagicMock()
    version_object.git_version = k8s_cluster_version
    version_api_mock.get_code.return_value = version_object
    kubeconfig_path = "fake-path.yaml"
    with pytest.raises(K8SCheckError):
        check_k8s_cluster_version(kubeconfig_path=kubeconfig_path)

    assert version_api_mock.get_code.call_count == 1


@pytest.mark.parametrize("k8s_cluster_version", ["v1.2.3"])
def test_check_cluster_version_exception(version_api_mock, k8s_cluster_version):
    version_object = MagicMock()
    version_object.git_version = k8s_cluster_version
    version_api_mock.get_code.return_value = version_object
    kubeconfig_path = "fake-path.yaml"
    with pytest.raises(
        K8SCheckError,
        match=re.escape(
            "Not supported Kubernetes cluster version: v1.2.3. "
            "The list of supported versions can be found in the installation manual."
        ),
    ):
        check_k8s_cluster_version(kubeconfig_path=kubeconfig_path)

    assert version_api_mock.get_code.call_count == 1


def list_metrics_server_pods_mock(mocker, phase: str):
    pod_metadata_name_mock = "metrics-server-xyz"
    pod_metadata_namespace_mock = "kube-system"
    pod_metadata_mock = MagicMock(name=pod_metadata_name_mock, namespace=pod_metadata_namespace_mock)
    pod_status_phase = MagicMock(phase=phase)

    pod_mock = MagicMock(status=pod_status_phase, metadata=pod_metadata_mock)

    list_pod_for_all_namespaces_mock = MagicMock(items=[pod_mock])

    core_api_mock = mocker.patch("checks.k8s.kube_client.CoreV1Api").return_value
    core_api_mock.list_pod_for_all_namespaces.return_value = list_pod_for_all_namespaces_mock

    mocker.patch("checks.k8s.KubernetesConfigHandler", return_value=None)


@pytest.fixture
def list_metrics_server_running_pods(mocker):
    return list_metrics_server_pods_mock(mocker, phase="Running")


@pytest.fixture
def list_metrics_server_not_running_pods(mocker):
    return list_metrics_server_pods_mock(mocker, phase="Pending")


@pytest.mark.parametrize("metrics_server_response", ["v0.6.0\n", "v0.6.1\n", "v0.6.2\n"])
def test_check_metrics_server_version(mocker, metrics_server_response, list_metrics_server_running_pods):
    kubeconfig_path = "fake-path.yaml"

    mocker.patch("checks.k8s.stream", return_value=metrics_server_response)

    check_metrics_server_version(kubeconfig_path=kubeconfig_path)


@pytest.mark.parametrize("metrics_server_response", ["v0.5.0\n", "v1.0.0\n", "v1.6.0\n"])
def test_check_metrics_server_wrong_version(mocker, metrics_server_response, list_metrics_server_running_pods):
    kubeconfig_path = "fake-path.yaml"

    mocker.patch("checks.k8s.stream", return_value=metrics_server_response)

    with pytest.raises(
        K8SCheckError,
        match=re.escape(
            f"Not supported metrics-server version: {metrics_server_response.strip()}. "
            "The list of supported versions can be found in the installation manual."
        ),
    ):
        check_metrics_server_version(kubeconfig_path=kubeconfig_path)


def test_check_metrics_server_connection_error(mocker, list_metrics_server_running_pods):
    kubeconfig_path = "fake-path.yaml"
    mocker.patch("checks.k8s.KubernetesConfigHandler", return_value=None)
    mocker.patch("checks.k8s.stream", side_effect=ApiException)
    with pytest.raises(
        K8SCheckError,
        match=re.escape(K8SChecksTexts.metrics_server_connection_error),
    ):
        check_metrics_server_version(kubeconfig_path=kubeconfig_path)


def test_check_metrics_server_installed(list_metrics_server_running_pods):
    kubeconfig_path = "fake-path.yaml"

    check_metrics_server_installed(kubeconfig_path=kubeconfig_path)


def test_check_metrics_server_installed_pod_not_running(list_metrics_server_not_running_pods):
    kubeconfig_path = "fake-path.yaml"

    with pytest.raises(
        K8SCheckError,
        match=re.escape("Component metrics-server found, but not running. Ensure component metrics-server is running."),
    ):
        check_metrics_server_installed(kubeconfig_path=kubeconfig_path)


def test_check_metrics_server_not_found(mocker):
    core_api_mock = mocker.patch("checks.k8s.kube_client.CoreV1Api").return_value
    core_api_mock.list_pod_for_all_namespaces.return_value = MagicMock(items=[])

    mocker.patch("checks.k8s.KubernetesConfigHandler", return_value=None)

    kubeconfig_path = "fake-path.yaml"

    with pytest.raises(
        K8SCheckError,
        match=re.escape(
            "Component metrics-server not found. Deploy supported version on your Kubernetes cluster. "
            "The list of supported versions can be found in the installation manual."
        ),
    ):
        check_metrics_server_installed(kubeconfig_path=kubeconfig_path)


def test_check_istio_ingress_gateway_installation_success(core_api_mock, custom_api_mock, mocker):
    mock_pod = MagicMock()
    mock_pod.metadata.name = "istio-gateway-123"
    mock_pod.status.phase = "Running"
    mocker.patch("checks.k8s.RUNNING_ISTIO_INGRESSGATEWAY_POD", None)

    mock_svc = MagicMock()
    mock_svc.status.load_balancer.ingress = [MagicMock(ip="10.211.120.0")]
    core_api_mock.read_namespaced_service.return_value = mock_svc

    mock_gateway = {"metadata": {"name": ISTIO_GATEWAY_CRD_NAME}}
    core_api_mock.list_namespaced_pod.return_value = MagicMock(items=[mock_pod])
    custom_api_mock.list_namespaced_custom_object.return_value = {"items": [mock_gateway]}

    check_istio_ingress_gateway_installation("/etc/rancher/k3s/k3s.yaml")
    assert k8s.RUNNING_ISTIO_INGRESSGATEWAY_POD == mock_pod


def test_check_istio_ingress_gateway_installation_api_exception(core_api_mock):
    core_api_mock.list_namespaced_pod.side_effect = ApiException()
    with pytest.raises(K8SCheckError) as e:
        check_istio_ingress_gateway_installation("/etc/rancher/k3s/k3s.yaml")

    assert str(e.value) == K8SChecksTexts.istio_ingress_gateway_connection_error
    core_api_mock.list_namespaced_pod.assert_called_once_with(namespace="istio-system")


def test_get_running_ingress_gateway_pod_success(core_api_mock, mocker):
    mock_pod = MagicMock()
    mock_pod.metadata.name = "istio-gateway-123"
    mock_pod.status.phase = "Running"
    mocker.patch("checks.k8s.RUNNING_ISTIO_INGRESSGATEWAY_POD", None)
    core_api_mock.list_namespaced_pod.return_value = MagicMock(items=[mock_pod])
    k8s.RUNNING_ISTIO_INGRESSGATEWAY_POD = _get_running_ingress_gateway_pod(
        core_api_mock, "istio-system", "istio-gateway"
    )
    assert k8s.RUNNING_ISTIO_INGRESSGATEWAY_POD == mock_pod
    core_api_mock.list_namespaced_pod.assert_called_once_with(namespace="istio-system")


def test_get_running_ingress_gateway_pod_no_ingress_gateway(core_api_mock):
    core_api_mock.list_namespaced_pod.return_value = MagicMock(items=[])
    with pytest.raises(K8SCheckError) as e:
        _get_running_ingress_gateway_pod(core_api_mock, "istio-system", "istio-gateway")
    assert str(e.value) == K8SChecksTexts.istio_ingress_gateway_installation_check_error
    core_api_mock.list_namespaced_pod.assert_called_once_with(namespace="istio-system")


def test_check_ingress_gateway_service_ip_success(core_api_mock):
    mock_svc = MagicMock()
    mock_svc.status.load_balancer.ingress = [MagicMock(ip="10.211.120.0")]
    core_api_mock.read_namespaced_service.return_value = mock_svc
    _check_ingress_gateway_service_ip(core_api_mock, "istio-system", "istio-gateway")
    core_api_mock.read_namespaced_service.assert_called_once_with(name="istio-gateway", namespace="istio-system")


def test_check_ingress_gateway_service_ip_no_ip(core_api_mock):
    mock_svc = MagicMock()
    mock_svc.status.load_balancer.ingress = None
    core_api_mock.read_namespaced_service.return_value = mock_svc
    with pytest.raises(K8SCheckError) as e:
        _check_ingress_gateway_service_ip(core_api_mock, "istio-system", "istio-gateway")
    assert str(e.value) == K8SChecksTexts.istio_ingress_gateway_ip_configuration_check_error


def test_check_istio_gateway_crd_success(custom_api_mock):
    mock_gateway = {"metadata": {"name": ISTIO_GATEWAY_CRD_NAME}}
    custom_api_mock.list_namespaced_custom_object.return_value = {"items": [mock_gateway]}
    _check_istio_gateway_crd(custom_api_mock, "istio-system")
    custom_api_mock.list_namespaced_custom_object.assert_called_once_with(
        group="networking.istio.io", version="v1beta1", namespace="istio-system", plural="gateways"
    )


def test_check_istio_gateway_crd_no_gateway(custom_api_mock):
    custom_api_mock.list_namespaced_custom_object.return_value = {"items": []}
    with pytest.raises(K8SCheckError) as e:
        _check_istio_gateway_crd(custom_api_mock, "istio-system")
    assert str(e.value) == K8SChecksTexts.istio_gateway_configuration_check_error
    custom_api_mock.list_namespaced_custom_object.assert_called_once_with(
        group="networking.istio.io", version="v1beta1", namespace="istio-system", plural="gateways"
    )


def test_check_istio_ingress_gateway_version_success(mocker):
    mock_container = MagicMock()
    mock_container.name = "istio-proxy"
    mock_container.image = "istio/proxyv2:1.18.1"
    mock_pod = MagicMock()
    mock_pod.spec.containers = [mock_container]
    mocker.patch("checks.k8s.RUNNING_ISTIO_INGRESSGATEWAY_POD", mock_pod)
    check_istio_ingress_gateway_version()


def test_check_istio_ingress_gateway_version_fail(mocker):
    wrong_version = "1.16.1"
    mock_container = MagicMock()
    mock_container.name = "istio-proxy"
    mock_container.image = f"istio/proxyv2:{wrong_version}"
    mock_pod = MagicMock()
    mock_pod.spec.containers = [mock_container]
    mocker.patch("checks.k8s.RUNNING_ISTIO_INGRESSGATEWAY_POD", mock_pod)

    with pytest.raises(K8SCheckError) as e:
        check_istio_ingress_gateway_version()

    assert str(e.value) == K8SChecksTexts.istio_ingress_gateway_version_check_error.format(
        present_istio_version=wrong_version,
    )


def test_check_istio_ingress_gateway_version_skip(mocker):
    mocker.patch("checks.k8s.RUNNING_ISTIO_INGRESSGATEWAY_POD", None)
    with pytest.raises(CheckSkipped):
        check_istio_ingress_gateway_version()
