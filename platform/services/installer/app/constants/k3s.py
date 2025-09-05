# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
"""Module containing constants related to k3s installation/upgrade"""

# If this constant is set to True, K3S will be upgraded during upgrade operation
UPGRADE_K3S = True

# Minimal available free disk space threshold, for k3s pod eviction, in Gi units
MIN_FREE_DISK_SPACE_GIB = 5
