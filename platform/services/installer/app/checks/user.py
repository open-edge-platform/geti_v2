# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module containing check functions that are interacting with local user.
"""

import logging
import os

from checks.errors import LocalUserCheckError
from texts.checks import LocalUserChecksTexts

logger = logging.getLogger(__name__)

ROOT_UID = 0


def check_user_id():  # noqa: ANN201
    """
    Check that proper local user is used.
    """
    uid = os.getuid()
    if uid != ROOT_UID:
        raise LocalUserCheckError(LocalUserChecksTexts.user_check_error)
