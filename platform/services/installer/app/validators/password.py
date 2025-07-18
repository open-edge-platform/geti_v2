# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module with validating functions for passwords.
"""

from click import BadParameter, Context, Parameter

from cli_utils.credentials import generate_password
from texts.validators import PasswordValidatorsTexts
from validators.errors import ValidationError

ALLOWED_SPECIAL_CHARACTERS = "!$&()*+,-.:;<=>?@[]^_{|}~"


def is_password_valid(context: Context, param: Parameter, value: str) -> str:
    """
    Check if given password is correct, raise ValidationError otherwise.
    It will create password if it is not provided.

    context: Click context object
    param: Click parameter object
    value: Value of the parameter
    """
    try:
        if not value:
            value = is_password_valid(context=context, param=param, value=generate_password())
        elif not all(
            [
                len(value) >= 8,
                len(value) <= 200,
                any(letter.isupper() for letter in value),
                any(letter.islower() for letter in value),
                any(letter in ALLOWED_SPECIAL_CHARACTERS or letter.isdigit() for letter in value),
            ]
        ):
            raise ValidationError(PasswordValidatorsTexts.invalid_password)
    except ValidationError as e:
        raise BadParameter(str(e))
    return value
