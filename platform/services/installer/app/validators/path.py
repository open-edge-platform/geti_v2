# INTEL CONFIDENTIAL
#
# Copyright (C) 2022 Intel Corporation
#
# This software and the related documents are Intel copyrighted materials, and your use of them is governed by
# the express license under which they were provided to you ("License"). Unless the License provides otherwise,
# you may not use, modify, copy, publish, distribute, disclose or transmit this software or the related documents
# without Intel's prior written permission.
#
# This software and the related documents are provided as is, with no express or implied warranties,
# other than those that are expressly stated in the License.

"""
A module with validating functions for data folder path.
"""

import os.path

from click import BadParameter, Context, Parameter

from constants.paths import DATA_FOLDER
from texts.validators import PathValidatorsTexts
from validators.errors import ValidationError


def is_path_is_absolute(path: str) -> None:
    """
    Checks whether the given path is absolute.
    Raises ValidationError if given path is not absolute.
    """
    if not os.path.isabs(path):
        raise ValidationError(PathValidatorsTexts.invalid_path.format(path=path, folder=DATA_FOLDER))


def is_path_valid(path: str) -> None:
    """
    Checks whether the existing path is absolute, is not empty, is a not a directory and does not exist.
    Raises ValidationError if given path is invalid.
    """
    is_path_is_absolute(path)
    if os.path.isfile(path):
        raise ValidationError(PathValidatorsTexts.path_not_folder.format(path=path))
    if os.listdir(path):
        raise ValidationError(PathValidatorsTexts.path_not_empty.format(path=path))


def is_data_folder_valid(context: Context, param: Parameter, value: str) -> str:  # noqa: ARG001
    """
    Validates data folder path in terms of permissions.
    If directory is not provided, it creates a default data folder.
    Raises ValidationError if given path has incorrect permissions.

    context: Click context object
    param: Click parameter object
    value: Value of the parameter
    """
    try:
        if os.path.exists(value):
            is_path_valid(value)
            if get_path_permissions(value)[-1] != "0":
                raise ValidationError(
                    PathValidatorsTexts.invalid_permissions.format(path=value, permissions=get_path_permissions(value))
                )
        else:
            is_path_is_absolute(value)
    except ValidationError as e:
        raise BadParameter(str(e))
    return value


def get_path_permissions(path: str) -> str:
    """
    Extracts permissions of file or directory of given path.
    """
    path_metadata = os.stat(path=path)
    permissions_code = oct(path_metadata.st_mode)[-3:]
    return str(permissions_code)
