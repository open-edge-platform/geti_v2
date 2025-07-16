# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module with validating functions for emails.
"""

import re

from click import BadParameter, Context, Parameter

from texts.validators import EmailValidatorsTexts
from validators.errors import ValidationError


def is_email_valid(context: Context, param: Parameter, value: str) -> str:  # noqa: ARG001
    """
    Validates email address format, raises ValidationError if given mail is invalid.

    context: Click context object
    param: Click parameter object
    value: Value of the parameter
    """
    try:
        regex = re.compile(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)")
        if not re.fullmatch(regex, str(value)):
            raise ValidationError(EmailValidatorsTexts.invalid_email.format(mail=value))
    except ValidationError as e:
        raise BadParameter(str(e))
    return value
