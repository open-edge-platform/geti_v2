# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
Strings that are shown to the user by validators functions.
"""


class EmailValidatorsTexts:
    """
    Strings that are shown to the user during email validation.
    """

    empty_email = "Provided email is empty."
    invalid_email = "{mail} is not a valid email address."


class PasswordValidatorsTexts:
    """
    Strings that are shown to the user during password validation.
    """

    empty_password = "Provided password is empty."  # noqa: S105
    invalid_password = (
        "Password must consist of 8 - 200 characters at least one capital letter, lower letter, digit or symbol."  # noqa: S105
    )


class PathValidatorsTexts:
    """
    Strings that are shown to the user during path validation.
    """

    empty_path = "path is empty."
    invalid_path = "Provided path {path} format is not correct. It must be an absolute path (e.g. /data)."
    path_not_exists = (
        "Provided path {path} does not point to an existing folder. It must be an absolute path (e.g. /data)."
    )
    path_not_folder = "Provided path {path} does not point to a folder."
    path_not_empty = "Provided folder {path} is not empty."
    invalid_permissions = "Provided folder {path} has too open permissions {permissions}. Recommended are 750."


class DomainValidatorsTexts:
    """
    Strings that are shown to the user during domain validation.
    """

    empty_domain = "domain is empty."
    invalid_name = "Provided name {name} does not have a valid format."


class FilepathValidatorsTexts:
    """
    Strings that are shown to the user during filepath validation.
    """

    empty_filepath = "filepath is empty."
    invalid_filepath = (
        "Provided file {filepath} is not valid. Filepath must be an absolute path (e.g. /home/user/filename)"
    )
    filepath_not_exists = "Provided file {filepath} does not exists on the filesystem."
    filepath_not_readable = "Provided file {filepath} is not readable or has wrong access permission."


class MailServerValidatorsTexts:
    """
    Strings that are shown to the user during SMTP server validation.
    """

    connection_failed = "Unable to connect to Mail Server ({host}:{port})"
