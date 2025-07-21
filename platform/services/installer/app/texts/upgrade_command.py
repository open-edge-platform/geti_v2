# INTEL CONFIDENTIAL
#
# Copyright (C) 2022 Intel Corporation
#
# This software and the related documents are Intel copyrighted materials, and your use of them is governed by
# the express license under which they were provided to you ("License"). Unless the License provides otherwise,
# you may not use, modify, copy, publish, distribute, disclose or transmit this software or the related documents
# without Intel's prior written permission.
#
# This software and the related documents are provided as is, with no express or implied warranties,
# other than those that are expressly stated in the License.

"""
Strings that are shown to the user by installation command.
"""


class UpgradeCmdTexts:
    """
    Contains strings shown to the user by installation command.
    """

    start_message = "Running platform migration..."
    prepare_message = "Starting migration preparation..."
    gather_message = "Gathering information about the current Geti installation..."
    checks_error_message = "Migration checks failed, aborting migration..."
    execution_start_message = "Executing migration..."


class UpgradeCmdConfirmationTexts:
    """
    Texts displayed on final confirmation prompt, before executing installation.
    """

    confirm_username_message = "Admin user login name: {username}"
    confirm_data_message = "Path to the data storage: {path}"
    # accept_config_prompt = "Is the provided data correct and you want to proceed with the installation?"
    cert_file_message = "Path to the certificate file: {path}"
    key_file_message = "Path to the key file: {path}"
    no_custom_certificate_message = "Custom SSL certificate will not be configured."
