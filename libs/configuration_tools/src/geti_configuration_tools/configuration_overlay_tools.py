# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from geti_configuration_tools.training_configuration import PartialTrainingConfiguration, TrainingConfiguration


class ConfigurationOverlayTools:
    @classmethod
    def delete_none_from_dict(cls, d: dict) -> dict:
        """
        Remove None values recursively from dictionaries.

        :param d: Dictionary to process
        :return: Dictionary with None values removed
        """
        for key, value in list(d.items()):
            if isinstance(value, dict):
                cls.delete_none_from_dict(value)
            elif value is None:
                del d[key]
            elif isinstance(value, list):
                for v_i in value:
                    if isinstance(v_i, dict):
                        cls.delete_none_from_dict(v_i)
        return d

    @classmethod
    def merge_deep_dict(cls, a: dict, b: dict) -> dict:
        """
        Recursively merge dictionaries 'b' into 'a' with deep dictionary support.

        This method merges keys and values from dictionary 'b' into dictionary 'a'.
        For nested dictionaries, it performs a recursive merge. For all other value types,
        values from 'b' overwrite values in 'a' when keys exist in both dictionaries.

        Example:
            a = {'x': 1, 'y': {'a': 2}}
            b = {'y': {'b': 3}, 'z': 4}
            result = {'x': 1, 'y': {'a': 2, 'b': 3}, 'z': 4}

        :param a: Target dictionary to merge into (modified in-place)
        :param b: Source dictionary whose values will be merged into 'a'
        :return: The modified dictionary 'a' containing merged values from 'b'
        """
        for key, val in b.items():
            if key in a:
                if isinstance(a[key], dict) and isinstance(val, dict):
                    cls.merge_deep_dict(a[key], val)
                else:
                    a[key] = val
            else:
                a[key] = val
        return a

    @classmethod
    def overlay_training_configurations(
        cls,
        base_config: PartialTrainingConfiguration,
        *overlaying_configs: PartialTrainingConfiguration,
        validate_full_config: bool = True,
    ) -> TrainingConfiguration | PartialTrainingConfiguration:
        """
        Overlays multiple training configurations on top of a base configuration.

        This method takes a base configuration and applies successive overlay configurations
        on top of it, merging dictionaries deeply. The result can be validated as either
        a full or partial training configuration.

        :param base_config: The base configuration to start with
        :param overlaying_configs: Variable number of configurations to overlay on the base
        :param validate_full_config: If True, validates result as a full TrainingConfiguration,
                                     otherwise as a PartialTrainingConfiguration
        :return: The merged configuration, either as TrainingConfiguration or PartialTrainingConfiguration
        """
        base_config_dict = cls.delete_none_from_dict(base_config.model_dump())

        overlay_config_dict = base_config_dict
        for config in overlaying_configs:
            config_dict = cls.delete_none_from_dict(config.model_dump())
            overlay_config_dict = cls.merge_deep_dict(overlay_config_dict, config_dict)

        overlay_config_dict["id_"] = base_config.id_

        if validate_full_config:
            return TrainingConfiguration.model_validate(overlay_config_dict)
        return PartialTrainingConfiguration.model_validate(overlay_config_dict)
