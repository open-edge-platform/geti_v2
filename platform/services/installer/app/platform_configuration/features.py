# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""Module used to retrieve information about platform feature configuration."""

import os
from enum import Enum

from constants.feature_flags import FEATURE_FLAGS


class FeatureFlag(str, Enum):
    """Represents feature flags' names"""

    AMBIENT_MESH = "FEATURE_FLAG_AMBIENT_MESH"
    CREDIT_SYSTEM = "FEATURE_FLAG_CREDIT_SYSTEM"
    OFFLINE_INSTALLATION = "FEATURE_FLAG_OFFLINE_INSTALLATION"
    OIDC_CIDAAS = "FEATURE_FLAG_OIDC_CIDAAS"
    SUPPORT_CORS = "FEATURE_FLAG_SUPPORT_CORS"
    USER_ONBOARDING = "FEATURE_FLAG_USER_ONBOARDING"
    MANAGE_USERS = "FEATURE_FLAG_MANAGE_USERS"
    TELEMETRY_STACK = "FEATURE_FLAG_TELEMETRY_STACK"


def get_updated_feature_flags(add_feature_flags: dict | None = None) -> dict[str, str]:
    """
    Get dictionary with updated values of the FEATURE_FLAGS dictionary if the appropriate environment variable
    has been set
    """
    env_variables = dict(os.environ)
    offline_tools_dir = "tools"
    env_variables[FeatureFlag.OFFLINE_INSTALLATION] = (
        "true" if (os.path.isdir(offline_tools_dir) and os.listdir(offline_tools_dir) != []) else "false"
    )

    feature_flags = {
        key: str(env_variables.get(key, default_value)).lower() for key, default_value in FEATURE_FLAGS.items()
    }

    # Update feature flags with additional flags if provided
    if add_feature_flags:
        feature_flags.update(add_feature_flags)
    return feature_flags


def is_feature_flag_enabled(feature_flag: FeatureFlag) -> bool:
    """
    Returns whether the provided feature flag is enabled

    :param feature_flag: the feature flag to check
    :return: True if enabled, false otherwise
    """
    flag = get_updated_feature_flags().get(feature_flag)

    if flag is None:
        return False

    return flag.lower() in ("true", "1", "t")
