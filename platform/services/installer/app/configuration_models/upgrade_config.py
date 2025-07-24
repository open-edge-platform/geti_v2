# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module containing config classes for upgrade operation.
"""

import os

from configuration_models.base_config_model import BaseConfig, ConfigurationField
from constants.os import SupportedOS
from constants.paths import K3S_KUBECONFIG_PATH, OFFLINE_TOOLS_DIR
from constants.platform import EXTERNAL_REGISTRY_ADDRESS, PLATFORM_REGISTRY_ADDRESS


class UpgradeConfig(BaseConfig):
    """
    A Config model for upgrade operation.
    """

    @property
    def custom_certificate(self) -> bool:
        """
        Return value specifying whether custom certificate settings were provided.
        """
        return bool(self.tls_cert_file.value) and bool(self.tls_key_file.value)

    @staticmethod
    def tools_in_package() -> bool:
        return os.path.isdir(OFFLINE_TOOLS_DIR) and bool(os.listdir(OFFLINE_TOOLS_DIR))

    def __init__(self) -> None:
        self.username = ConfigurationField(type=str, required=True)
        self.password = ConfigurationField(type=str, required=True)
        self.data_folder = ConfigurationField(type=str, required=False)
        self.tls_cert_file = ConfigurationField(type=str, required=False)
        self.tls_key_file = ConfigurationField(type=str, required=False)
        self.tls_cert_content = ConfigurationField(type=str, required=False)
        self.tls_key_content = ConfigurationField(type=str, required=False)

        # root CA ta pass to the helm controller
        self.repoCA = ConfigurationField(type=str, required=False)

        # to determine local OS
        self.local_os = ConfigurationField(type=str, required=False, value=SupportedOS.UBUNTU.value)

        # to determine if GPU support should be skipped or not,
        # from the client perspective, GPU is always required.
        _skip_gpu_support = os.getenv("PLATFORM_GPU_REQUIRED") == "false"
        self.gpu_support = ConfigurationField(type=bool, required=False, value=not _skip_gpu_support)
        self.gpu_provider = ConfigurationField(type=str, required=False, value="")
        self.render_gid = ConfigurationField(type=int, required=False, value=0)

        # parameters which are part of config,
        # but are not provided by user
        self.password_sha = ConfigurationField(type=str, required=False, value=None)

        self.image_registry = ConfigurationField(type=str, required=False, value=EXTERNAL_REGISTRY_ADDRESS)

        self.geti_image_registry = ConfigurationField(type=str, required=False, value=PLATFORM_REGISTRY_ADDRESS)

        self.backup_location = ConfigurationField(type=str, required=False, trim=True)

        _tools_in_package = self.tools_in_package()
        self.lightweight_installer = ConfigurationField(type=bool, required=False, value=not _tools_in_package)
        self.internet_access = ConfigurationField(type=bool, required=False, value=True)
        self.kube_config = ConfigurationField(type=str, required=False, value=K3S_KUBECONFIG_PATH)
