# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from kubernetes import config

from constants.paths import K3S_KUBECONFIG_PATH


class KubernetesConfigHandler:
    """
    Singleton class to manage the loading and reloading of Kubernetes configuration.

    This class ensures that the Kubernetes configuration is loaded only once
    and provides a mechanism to reload the configuration with a different
    kubeconfig file if necessary.
    """

    _instance = None

    def __new__(cls, kube_config: str = K3S_KUBECONFIG_PATH):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._load_kube_config(kube_config=kube_config)
        return cls._instance

    @classmethod
    def _load_kube_config(cls, kube_config: str = K3S_KUBECONFIG_PATH):
        config.load_kube_config(config_file=kube_config)
        return config

    @classmethod
    def reload(cls, kube_config: str):
        cls._instance = None
        cls._instance = cls(kube_config)
        return cls._instance
