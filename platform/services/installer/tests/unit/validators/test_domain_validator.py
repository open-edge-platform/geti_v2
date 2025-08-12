# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import pytest

from validators.domain import ValidationError, is_domain_valid, is_fqdn_valid


@pytest.mark.parametrize(
    ["domain", "valid"],
    [
        ("com", True),
        (".com", False),
        ("b.c", True),
        ("127.0.0.1", True),
        ("", True),
        (None, True),
        ("a.b.c.d.e", True),
    ],
)
def test_is_domain_valid(domain, valid):
    if not valid:
        with pytest.raises(ValidationError):
            is_domain_valid(domain)
    else:
        is_domain_valid(domain)


@pytest.mark.parametrize(
    ["domain", "valid"],
    [
        ("com", False),
        (".com", False),
        ("b.c", True),
        ("127.0.0.1", True),
        (None, False),
        ("", False),
        ("a.b.c.d.e", True),
    ],
)
def test_is_fqdn_valid(domain, valid):
    if not valid:
        with pytest.raises(ValidationError):
            is_fqdn_valid(domain)
    else:
        is_fqdn_valid(domain)
