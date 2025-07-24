# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
Strings that are shown to the user by upgrade command.
"""


class UpgradeCmdTexts:
    """
    Contains strings shown to the user by upgrade command.
    """

    start_message = "Running platform migration..."
    prepare_message = "Starting migration preparation..."
    gather_message = "Gathering information about the current Geti installation..."
    checks_error_message = "Migration checks failed, aborting migration..."
    execution_start_message = "Executing migration..."


class UpgradeCmdConfirmationTexts:
    """
    Texts displayed on final confirmation prompt, before executing upgrade.
    """

    confirm_username_message = "Admin user login name: {username}"
    confirm_data_message = "Path to the data storage: {path}"
    cert_file_message = "Path to the certificate file: {path}"
    key_file_message = "Path to the key file: {path}"
    no_custom_certificate_message = "Custom SSL certificate will not be configured."
