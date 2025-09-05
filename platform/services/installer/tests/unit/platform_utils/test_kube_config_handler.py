# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from unittest.mock import patch

from platform_utils.kube_config_handler import KubernetesConfigHandler


@patch.object(KubernetesConfigHandler, "_load_kube_config")
def test_load_kube_config_called_once(mock_load_kube_config):
    kube_config = "path/to/your/kube_config"
    # Clean previous test instances
    KubernetesConfigHandler._instance = None

    handler_instance = KubernetesConfigHandler(kube_config)
    another_instance = KubernetesConfigHandler(kube_config)

    assert handler_instance is another_instance
    mock_load_kube_config.assert_called_once_with(kube_config=kube_config)


@patch.object(KubernetesConfigHandler, "_load_kube_config")
def test_reload_kube_config(mock_load_kube_config):
    kube_config = "path/to/your/kube_config"
    new_kube_config = "path/to/your/new_kube_config"

    handler_instance = KubernetesConfigHandler(kube_config)
    reloaded_instance = KubernetesConfigHandler.reload(new_kube_config)

    mock_load_kube_config.assert_called_with(kube_config=new_kube_config)
    assert handler_instance is not reloaded_instance
