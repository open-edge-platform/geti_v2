# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
"""Module containing other common variables used in the platform installer"""

import os

PLATFORM_NAMESPACE = "impt"
FLYTE_NAMESPACE = "flyte"

PLATFORM_CONFIGURATION_CM_NAME = f"{PLATFORM_NAMESPACE}-configuration"
PLATFORM_VERSION_CM_KEY = "platformVersion"

DATA_DIRS_REMOVAL_REQUIRED = ["mongodb", "ldap", "ldap-config"]
DATA_STORAGE_VOLUME_NAME = "data-storage-volume"
DATA_STORAGE_VOLUME_CLAIM_NAME = f"{DATA_STORAGE_VOLUME_NAME}-claim"

SERVICE_LICENSE_ADDRESS = "license:8000"
INTERNAL_REGISTRY_ADDRESS = "127.0.0.1:30000"
PLATFORM_REGISTRY_ADDRESS = os.getenv("PLATFORM_REGISTRY_ADDRESS", "ghcr.io")
EXTERNAL_REGISTRY_ADDRESS = os.getenv("EXTERNAL_REGISTRY_ADDRESS", "")
INTEL_EMAIL = "Geti.Team@intel.com"

GPU_PROVIDER_NVIDIA = "nvidia"
GPU_PROVIDER_INTEL_MAX = "intel-max"
GPU_PROVIDER_INTEL_ARC = "intel-arc"
GPU_PROVIDER_INTEL_ARC_A = "intel-arc-a"

DEFAULT_HISTORY_MAX = 3
