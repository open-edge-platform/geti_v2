# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import pytest

from checks.errors import LocalUserCheckError
from checks.user import check_user_id


def test_check_user_root(mocker):
    user_id_mock = mocker.patch("os.getuid")
    user_id_mock.return_value = 0

    check_user_id()
    assert user_id_mock.call_count == 1


def test_check_user_non_root(mocker):
    user_id_mock = mocker.patch("os.getuid")
    user_id_mock.return_value = 1000

    with pytest.raises(LocalUserCheckError):
        check_user_id()

    assert user_id_mock.call_count == 1
