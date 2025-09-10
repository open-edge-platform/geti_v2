# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from enum import Enum


class SupportedOS(str, Enum):
    """Kinds of supported operating systems."""

    UBUNTU = "Ubuntu"
    RHEL = "Red Hat"


class RequiredOS(str, Enum):
    """Versions of supported operating systems."""

    UBUNTU_20 = "Ubuntu 20.04"
    UBUNTU_22 = "Ubuntu 22.04"
    UBUNTU_24 = "Ubuntu 24.04"
    UBUNTU_25_04 = "Ubuntu 25.04"
    RHEL_9 = "Red Hat Enterprise Linux 9"


RENDER_GROUP = "render"
