# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
Validation of SMTP server config,
"""

import logging
import ssl
from smtplib import SMTP

from texts.validators import MailServerValidatorsTexts
from validators.errors import ValidationError

logger = logging.getLogger(__name__)


def verify_mailserver_configuration(  # noqa: ANN201
    host: str, port: int, username: str, password: str, timeout: int = 30
):
    """
    Verifies if Mail Server configuration is valid, by trying to connect to the Mail Server.
    """
    try:
        logger.info(f"Verifying connection to SMTP server {host}:{port}")
        smtp = SMTP(host=host, port=port, timeout=timeout)
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        if smtp.starttls(context=context)[0] != 220:
            raise ValueError("Provided SMTP server does not support TLS")
        smtp.login(
            user=username,
            password=password,
        )
    except Exception as ex:
        logger.exception("SMTP connection failed.")
        raise ValidationError(MailServerValidatorsTexts.connection_failed.format(host=host, port=port)) from ex
