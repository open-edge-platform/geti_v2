# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import pytest

from validators.email import ValidationError, is_email_valid


@pytest.mark.parametrize(
    ["email", "valid"],
    [("admin@test.com", True), ("admin", False), ("a@b.c", True), (12345, False), (None, False), ("", False)],
)
def test_is_email_valid(email, valid):
    if not valid:
        with pytest.raises(ValidationError):
            is_email_valid(email)
    else:
        is_email_valid(email)
