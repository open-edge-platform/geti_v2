# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from click import BadParameter


def check_tls_certificates(tls_cert_file: str | None, tls_key_file: str | None) -> None:
    """
    Check if the provided TLS certificate and key files are valid.
    """
    if bool(tls_cert_file) != bool(tls_key_file):  # XOR logic to check if only one is set
        raise BadParameter("Both --tls-cert-file and --tls-key-file must be set or neither should be set.")
