# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module containing config classes for installation operation.
"""

import os
from functools import partial

from cli_utils.credentials import generate_cookie_secret
from configuration_models.base_config_model import BaseConfig, ConfigurationField
from constants.k3s import MIN_FREE_DISK_SPACE_GIB
from constants.operations import INSTALL
from constants.os import SupportedOS
from constants.paths import K3S_INSTALLATION_MARK_FILEPATH, OFFLINE_TOOLS_DIR
from constants.platform import EXTERNAL_REGISTRY_ADDRESS, INTERNAL_REGISTRY_ADDRESS, PLATFORM_REGISTRY_ADDRESS
from validators.email import is_email_valid
from validators.filepath import is_filepath_valid
from validators.mailserver import verify_mailserver_configuration
from validators.password import is_password_valid
from validators.path import is_data_folder_valid


class InstallationConfig(BaseConfig):
    """
    A Config model for installation operation.
    """

    @property
    def interactive_mode(self) -> bool:
        """Determines whether config file was used or interactive mode"""
        return self._interactive_mode

    @property
    def install_on_existing_k8s(self) -> bool:
        """Return value specifying whether valid kube config was provided"""
        return bool(self.kube_config.value)

    @property
    def custom_certificate(self) -> bool:
        """
        Return value specifying whether custom certificate settings were provided.
        """
        return bool(self.cert_file.value) or bool(self.key_file.value)

    def __init__(self, interactive_mode: bool, install_telemetry_stack: bool) -> None:
        self._interactive_mode = interactive_mode

        self.install_telemetry_stack = ConfigurationField(type=bool, required=False, value=install_telemetry_stack)
        self.offer_k8s_option = ConfigurationField(
            type=bool, required=True, value=os.getenv("PLATFORM_K8S_OPTION") == "true"
        )
        self.kube_config = (
            ConfigurationField(type=str, required=False, validation_callback=is_filepath_valid, trim=True)
            if self.offer_k8s_option.value
            else ConfigurationField(type=str, required=False, value="")
        )
        self.user_login = ConfigurationField(type=str, required=True, validation_callback=is_email_valid)
        self.user_password = ConfigurationField(type=str, required=True, validation_callback=is_password_valid)
        self.data_folder = ConfigurationField(
            type=str, required=True, validation_callback=is_data_folder_valid, trim=True
        )
        self.cert_file = ConfigurationField(type=str, required=False, validation_callback=is_filepath_valid)
        self.key_file = ConfigurationField(type=str, required=False, validation_callback=is_filepath_valid, trim=True)

        self.smtp_address = ConfigurationField(type=str, required=False, value="")
        self.smtp_port = ConfigurationField(type=int, required=False, value=0)
        self.smtp_username = ConfigurationField(type=str, required=False, value="")
        self.smtp_password = ConfigurationField(type=str, required=False, value="")
        self.sender_address = ConfigurationField(type=str, required=False, validation_callback=is_email_valid)
        self.sender_name = ConfigurationField(type=str, required=False)

        # to determine local OS
        self.local_os = ConfigurationField(type=str, required=False, value=SupportedOS.UBUNTU.value)

        # to determine if GPU support should be skipped or not,
        # from the client perspective, GPU is always required.
        _skip_gpu_support = os.getenv("PLATFORM_GPU_REQUIRED") == "false"
        self.gpu_support = ConfigurationField(type=bool, required=False, value=not _skip_gpu_support)
        self.render_gid = ConfigurationField(type=int, required=False, value=0)

        # To determine if a platform is running on a VM or something else. Can be used  to disable resource intensive
        # components such as horizontal pod autoscaling
        platform_infrastructure_type = os.getenv("PLATFORM_INFRASTRUCTURE_TYPE", "")
        self.running_on_vm = ConfigurationField(
            type=bool, required=False, value=platform_infrastructure_type == "VIRTUAL"
        )

        # parameters which are part of config,
        # but are not provided by user
        self.operation = ConfigurationField(type=str, required=False, value=INSTALL)
        self.user_pass_sha = ConfigurationField(type=str, required=False, value=None)
        self.k3s_installation_mark_filepath = ConfigurationField(
            type=str, required=False, value=K3S_INSTALLATION_MARK_FILEPATH
        )

        # To determine whether the LGTM stack should be installed.
        self.grafana_enabled = ConfigurationField(type=bool, required=False, value=False)

        # Geti installs MongoDB database which has the SSPL license and CUDA components provided by Nvidia
        # a user has to accept the terms of use to install the platform
        self.accept_third_party_licenses = ConfigurationField(type=bool, required=True, value=False)

        _authorization_cookie_secret = generate_cookie_secret()
        self.authorization_cookie_secret = ConfigurationField(
            type=str, required=False, value=_authorization_cookie_secret
        )

        # To determine if installation is running on k3s.
        self.running_on_k3s = ConfigurationField(type=bool, required=False, value=True)

        self.min_free_disk_space_gib = ConfigurationField(type=int, required=False, value=MIN_FREE_DISK_SPACE_GIB)

        self.master_ip_autodetected = ConfigurationField(type=str, required=False)

        self.gpu_provider = ConfigurationField(type=str, required=False, value="")

        self.internet_access = ConfigurationField(type=bool, required=False, value=True)

        _tools_in_package = self.tools_in_package()
        self.lightweight_installer = ConfigurationField(type=bool, required=False, value=not _tools_in_package)

        registry = EXTERNAL_REGISTRY_ADDRESS if not _tools_in_package else INTERNAL_REGISTRY_ADDRESS
        self.image_registry = ConfigurationField(type=str, required=False, value=registry)

        _docker_registry = PLATFORM_REGISTRY_ADDRESS if not _tools_in_package else INTERNAL_REGISTRY_ADDRESS
        self.geti_image_registry = ConfigurationField(type=str, required=False, value=_docker_registry)

    def validate_smpt_configuration(self) -> None:
        """
        Check if connection to SMTP server provided in the config is possible.
        """
        verify_mailserver_configuration(
            host=self.smtp_address.value,
            port=self.smtp_port.value,
            username=self.smtp_username.value,
            password=self.smtp_password.value,
        )

    def validate(self) -> None:
        self.data_folder.validation_callback = partial(
            self.data_folder.validation_callback, is_remote_installation=self.install_on_existing_k8s
        )
        super().validate()
        is_platform_smtp_check_enabled = os.getenv("PLATFORM_SMTP_CHECK", "true")
        if is_platform_smtp_check_enabled.lower() == "true" and self.smtp_address.value:
            self.validate_smpt_configuration()

    def get_smtp_configuration_fields(self) -> list[ConfigurationField]:
        """
        Returns a list of fields related to SMTP server configuration.
        """
        return [
            self.smtp_address,
            self.smtp_port,
            self.smtp_username,
            self.smtp_password,
            self.sender_address,
            self.sender_name,
        ]

    @staticmethod
    def tools_in_package() -> bool:
        return os.path.isdir(OFFLINE_TOOLS_DIR) and bool(os.listdir(OFFLINE_TOOLS_DIR))
