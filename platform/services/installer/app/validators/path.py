# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module with validating functions for data folder path.
"""

import os.path
import re

from texts.validators import PathValidatorsTexts
from validators.errors import ValidationError


def is_path_valid(path: str, is_remote_installation: bool = False):  # noqa: ANN201
    """
    Validates path, raises ValidationError if given path is invalid. Checks whether the path exists for
    local installation.
    """
    if not path:
        raise ValidationError(PathValidatorsTexts.empty_path)
    regex = re.compile(r"(^[\/].*$)")
    if not re.fullmatch(regex, str(path)):
        raise ValidationError(PathValidatorsTexts.invalid_path.format(path=path))
    if not is_remote_installation:
        if not os.path.exists(path):
            raise ValidationError(PathValidatorsTexts.path_not_exists.format(path=path))
        if os.path.isfile(path):
            raise ValidationError(PathValidatorsTexts.path_not_folder.format(path=path))
        if os.listdir(path):
            raise ValidationError(PathValidatorsTexts.path_not_empty.format(path=path))


def is_data_folder_valid(path: str, is_remote_installation: bool):  # noqa: ANN201
    """
    Validates data folder path in terms of permissions, existence and emptiness of the folder.
    """
    is_path_valid(path=path, is_remote_installation=is_remote_installation)
    path_permissions = get_path_permissions(path=path)
    if path_permissions[-1] != "0":
        raise ValidationError(PathValidatorsTexts.invalid_permissions.format(path=path, permissions=path_permissions))


def get_path_permissions(path: str) -> str:
    """
    Extracts permissions of file or directory of given path.
    """
    path_metadata = os.stat(path=path)
    permissions_code = oct(path_metadata.st_mode)[-3:]
    return str(permissions_code)
