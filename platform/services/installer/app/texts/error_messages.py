# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
Strings that are used to check if installation/upgrade failed.
"""


class HelmErrorMessages:
    """
    Strings used to check for failed installation or upgrade
    """

    rate_limiter = "client rate limiter Wait returned an error: rate: Wait(n=1) would exceed context deadline"
    timeout = "timed out waiting for the condition"
