# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""This module implements the include models enum"""

from enum import Enum


class IncludeModels(str, Enum):
    """
    Enum indicating which models should be included in the project export
    """

    ALL = "all"
    NONE = "none"
    LATEST_ACTIVE = "latest_active"
