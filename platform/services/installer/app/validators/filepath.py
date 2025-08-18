# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module with validating functions for files
"""

import re
from os import R_OK, access
from os.path import isfile

from texts.validators import FilepathValidatorsTexts
from validators.errors import ValidationError


def is_filepath_valid(filepath: str):  # noqa: ANN201
    """
    Validates filepath, raises ValidationError if given filepath is invalid
    """
    if not filepath:
        raise ValidationError(FilepathValidatorsTexts.empty_filepath)
    regex = re.compile(r"(^[\/].*$)")
    if not re.fullmatch(regex, str(filepath)):
        raise ValidationError(FilepathValidatorsTexts.invalid_filepath.format(filepath=filepath))
    if not isfile(filepath):
        raise ValidationError(FilepathValidatorsTexts.filepath_not_exists.format(filepath=filepath))
    if not access(filepath, R_OK):
        raise ValidationError(FilepathValidatorsTexts.filepath_not_readable.format(filepath=filepath))
