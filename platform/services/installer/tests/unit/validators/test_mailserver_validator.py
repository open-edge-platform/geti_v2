# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE


from unittest.mock import MagicMock

import pytest

from validators.errors import ValidationError
from validators.mailserver import verify_mailserver_configuration


def test_verify_mailserver_configuration(mocker):
    smtp_instance_mock = MagicMock()
    mocker.patch("validators.mailserver.SMTP", return_value=smtp_instance_mock)

    smtp_instance_mock.starttls.return_value = [220]

    verify_mailserver_configuration(host="mail.example.com", port=12345, username="admin", password="password")


def test_verify_mailserver_configuration_failed(mocker):
    smtp_instance_mock = MagicMock()
    mocker.patch("validators.mailserver.SMTP", return_value=smtp_instance_mock)

    smtp_instance_mock.starttls.return_value = [220]
    smtp_instance_mock.login.side_effect = RuntimeError

    with pytest.raises(ValidationError):
        verify_mailserver_configuration(host="mail.example.com", port=12345, username="admin", password="password")
