# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module with validating functions for emails.
"""

import re

from texts.validators import EmailValidatorsTexts
from validators.errors import ValidationError


def is_email_valid(mail: str):  # noqa: ANN201
    """
    Validates email address format, raises ValidationError if given mail is invalid
    """
    if not mail:
        raise ValidationError(EmailValidatorsTexts.empty_email)
    regex = re.compile(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)")
    if not re.fullmatch(regex, str(mail)):
        raise ValidationError(EmailValidatorsTexts.invalid_email.format(mail=mail))
