# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module with validating functions for passwords.
"""

from texts.validators import PasswordValidatorsTexts
from validators.errors import ValidationError

ALLOWED_SPECIAL_CHARACTERS = "!$&()*+,-.:;<=>?@[]^_{|}~"


def is_password_valid(password: str):  # noqa: ANN201
    """
    Check if given password is correct, raise ValidationError otherwise.
    """
    if not password:
        raise ValidationError(PasswordValidatorsTexts.empty_password)

    password = str(password)
    if not all(
        [
            len(password) >= 8,
            len(password) <= 200,
            any(letter.isupper() for letter in password),
            any(letter.islower() for letter in password),
            any(letter in ALLOWED_SPECIAL_CHARACTERS or letter.isdigit() for letter in password),
        ]
    ):
        raise ValidationError(PasswordValidatorsTexts.invalid_password)
