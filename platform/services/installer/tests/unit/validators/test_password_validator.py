# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import pytest

from validators.password import ValidationError, is_password_valid


@pytest.mark.parametrize(
    ["password", "valid"],
    [
        ("Qwerty12345%", True),
        ("QqQQQQ123$", True),
        (" Qwhitespaces_are_allowed23$ ", True),
        (" Qwhitespaces inside are also allowed23$ ", True),
        ("admin", False),
        ("a@b.c", False),
        (123456789, False),
        (None, False),
        ("", False),
    ],
)
def test_is_password_valid(password, valid):
    if not valid:
        with pytest.raises(ValidationError):
            is_password_valid(password)
    else:
        is_password_valid(password)
