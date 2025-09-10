# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module for validating functions for domains.
"""

import re

from texts.validators import DomainValidatorsTexts
from validators.errors import ValidationError


def is_domain_valid(domain: str):  # noqa: ANN201
    """
    Validates domain format, raises ValidationError if given domain is invalid
    """
    if not domain:
        return
    regex = re.compile(
        r"(^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$)"
    )
    if not re.fullmatch(regex, str(domain)):
        raise ValidationError(DomainValidatorsTexts.invalid_name.format(name=domain))


def is_fqdn_valid(fqdn: str):  # noqa: ANN201
    """
    Validates fqdn format, raises ValidationError if given domain is not fqdn
    """
    if not fqdn:
        raise ValidationError(DomainValidatorsTexts.empty_domain)
    regex = re.compile(
        r"(^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$)"
    )
    if not re.fullmatch(regex, str(fqdn)):
        raise ValidationError(DomainValidatorsTexts.invalid_name.format(name=fqdn))
