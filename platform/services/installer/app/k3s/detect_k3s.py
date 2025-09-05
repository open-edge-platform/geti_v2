# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module responsible for detecting if kubernetes is running on k3s environment.
"""

from kubernetes import client

from platform_utils.kube_config_handler import KubernetesConfigHandler


def is_kubernetes_running_on_k3s(kubeconfig_path: str) -> bool:
    """
    Check if Kubernetes cluster is running on K3S.
    """
    KubernetesConfigHandler(kube_config=kubeconfig_path)

    with client.ApiClient() as kube_client:
        api_instance = client.CoreV1Api(kube_client)
        k3s_nodes = api_instance.list_node(
            label_selector="node.kubernetes.io/instance-type=k3s",
        )
        return k3s_nodes.items != []
