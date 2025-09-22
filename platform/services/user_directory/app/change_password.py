# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
"""Script used to update user password."""

import argparse
import base64

from geti_logger_tools.logger_config import initialize_logger

from users_handler.exceptions import WeakPassword
from users_handler.users_handler import UsersHandler

from config import AUTH_CONFIG

logger = initialize_logger(__name__)


def parse_args():  # noqa: ANN201
    """
    CLI args
    """
    parser = argparse.ArgumentParser(description="A script for changing user password in LDAP.")
    parser.add_argument("--password", type=str, required=True, help="New password for user.")
    parser.add_argument("--username", type=str, help="Email of the user, which password will be changed.")
    return parser.parse_args()


def main() -> None:
    """
    Main logic of change_password.py script. General steps of algorithm are:
    1. Instantiate UsersHandler
    2. Encode password taken from commandline argument by base64
    3. Check password strength
    4. Find user by email
    5. Change password for existing user
    """
    args = parse_args()
    handler = UsersHandler(**AUTH_CONFIG)
    logger.info(f"The password for '{args.username}' is being updated.")
    new_password = base64.urlsafe_b64encode(args.password.encode()).decode()
    try:
        handler.check_password_strength(new_password)
    except WeakPassword:
        logger.error("The provided password is not compliant with the password policy.")
        return

    user = next((u for u in handler.list_users() if u.get("mail") == args.username), None)
    if not user:
        logger.info("User not found.")
        return

    uid = user.get("uid")
    if not uid:
        logger.error("User found, but email is missing.")
        return

    handler.change_user_password(uid=uid, new_password=new_password)
    logger.info("The password updated successfully.")


if __name__ == "__main__":
    main()
