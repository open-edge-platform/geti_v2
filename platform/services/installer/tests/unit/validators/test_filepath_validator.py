# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE


from typing import TYPE_CHECKING

import pytest

from validators.filepath import ValidationError, is_filepath_valid

if TYPE_CHECKING:
    from unittest.mock import Mock


@pytest.mark.parametrize(
    "filename",
    [
        ("/"),
        ("/tmp"),
        ("notmp"),
        ("/etc"),
        ("/1/2/3/4/5/6/"),
        (None),
        (""),
    ],
)
def test_invalid_filepath(filename):
    with pytest.raises(ValidationError):
        is_filepath_valid(filename)


def test_valid_filepath(mocker):
    isfile_mock: Mock = mocker.patch("validators.filepath.isfile")
    osaccess_mock: Mock = mocker.patch("validators.filepath.access")
    is_filepath_valid("/proper/path/to/file")

    assert isfile_mock.call_count == 1
    assert osaccess_mock.call_count == 1
