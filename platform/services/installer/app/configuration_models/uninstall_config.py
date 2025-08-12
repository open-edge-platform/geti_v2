# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module containing config classes for uninstallation operation.
"""

from configuration_models.base_config_model import BaseConfig, ConfigurationField
from constants.operations import UNINSTALL


class UninstallationConfig(BaseConfig):
    """
    A Config model for uninstallation operation.
    """

    @property
    def interactive_mode(self) -> bool:
        """Determines whether config file was used or interactive mode"""
        return self._interactive_mode

    def __init__(self, interactive_mode: bool) -> None:
        self._interactive_mode = interactive_mode

        self.delete_data = ConfigurationField(type=bool, required=False)

        # parameters which are part of config,
        # but are not provided by user
        self.operation = ConfigurationField(type=str, required=False, value=UNINSTALL)

        self.internet_access = ConfigurationField(type=bool, required=False, value=True)
