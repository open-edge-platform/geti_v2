# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import logging
import os
import subprocess

from constants.platform import CRITICAL_SECRETS, DATA_FOLDER_PATH, PLATFORM_VERSION
from platform_operations.cluster import _get_secret

logger = logging.getLogger(__name__)


def _get_available_storage() -> int:
    """
    Get available storage in MB for the specified directory.
    This checks the storage associated with the persistent volume mounted in the Pod.
    """
    process = subprocess.run(  # noqa S603
        ["/bin/sh", "-c", f"df -m {DATA_FOLDER_PATH} | tail -n1"], capture_output=True, text=True, check=True
    )
    available_storage = int(process.stdout.split()[3])
    logger.debug(f"Available storage for {DATA_FOLDER_PATH}: {available_storage} MB")
    return available_storage


def _get_used_storage() -> int:
    """
    Get used storage in MB for the specified data folder.
    This calculates the storage used within the persistent volume and adds a buffer for the backup.
    """
    process = subprocess.run(  # noqa S603
        [
            "/bin/sh",
            "-c",
            f"du --max-depth=0 -m "
            f"--exclude='{DATA_FOLDER_PATH}/binary_data' "
            f"--exclude='{DATA_FOLDER_PATH}/seaweedfs' "
            f"{DATA_FOLDER_PATH}",
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    used_storage = int(process.stdout.split("\t")[0]) + 5000
    logger.debug(f"Used storage for {DATA_FOLDER_PATH}: {used_storage} MB with 5 GB buffer")
    return used_storage


def is_backup_possible() -> bool:
    """
    Checks if there is sufficient storage space on the server to perform a backup.
    The check is performed on the persistent volume mounted in the Pod.
    """
    # Calculate required storage (used storage + 5 GB buffer)
    required_storage = _get_used_storage()
    logger.debug(f"Required storage for backup: {required_storage} MB")

    available_storage = _get_available_storage()

    return required_storage <= available_storage


def backup_secrets(location: str) -> None:
    """
    Create a backup of critical secrets in the specified location.
    """
    for secret in CRITICAL_SECRETS:
        try:
            secret_data = _get_secret(secret)
            if secret_data:
                secret_file_path = os.path.join(location, f"{secret}.json")
                with open(secret_file_path, "w", encoding="utf-8") as secret_file:
                    secret_file.write(secret_data)
                logger.info(f"Secret '{secret}' backed up successfully.")
            else:
                logger.warning(f"Secret '{secret}' is empty or not found.")
        except Exception as e:
            logger.error(f"Failed to backup secret '{secret}': {e}")


def backup_data_folder() -> None:
    """
    Backup data folder
    """
    logger.info("Running data folder backup.")
    backup_location = os.path.join(DATA_FOLDER_PATH, f"backup_data_{PLATFORM_VERSION}")

    # Remove the existing backup directory if it exists and create a new one
    subprocess.run(  # noqa S603
        ["/bin/sh", "-c", "rm", "-rf", backup_location], capture_output=True, text=True, check=True
    )
    os.makedirs(backup_location, exist_ok=True)

    # Remove all previous backup directories except the current one
    subprocess.run(  # noqa S603
        [
            "/bin/sh",
            "-c",
            f"export GLOBIGNORE={backup_location}; rm -rf {DATA_FOLDER_PATH}/backup_data*; unset GLOBIGNORE",
        ],
        capture_output=True,
        text=True,
        check=True,
    )

    # Backup critical secrets
    backup_secrets(location=backup_location)

    # Ignore specified directories during backup
    glob_ignore_list = [
        os.path.join(DATA_FOLDER_PATH, "binary_data"),
        backup_location,
        os.path.join(DATA_FOLDER_PATH, "logs"),
        os.path.join(DATA_FOLDER_PATH, "seaweedfs"),
        os.path.join(DATA_FOLDER_PATH, "registry"),
        os.path.join(DATA_FOLDER_PATH, "etcd"),
    ]
    glob_ignore = ":".join(glob_ignore_list)
    subprocess.run(  # noqa S603
        [
            "/bin/sh",
            "-c",
            f"export GLOBIGNORE={glob_ignore}; cp -a {DATA_FOLDER_PATH}/* {backup_location}/; unset GLOBIGNORE",
        ],
        capture_output=True,
        text=True,
        check=True,
    )

    logger.info(f"Data folder backup created under: '{backup_location}'")


# def restore_data_folder(backup_location: str, data_folder: str) -> None:
#     """
#     Restore data folder
#     """
#
#     logger.info("Restoring data folder backup.")
#     if os.path.exists(backup_location):
#         with open(INSTALL_LOG_FILE_PATH, "a", encoding="utf-8") as log_file:
#             # Ignore specified directories during restore
#             glob_ignore_list = [
#                 os.path.join(data_folder, "binary_data"),
#                 os.path.join(data_folder, "logs"),
#                 backup_location,
#                 os.path.join(data_folder, "seaweedfs"),
#                 os.path.join(data_folder, "etcd"),
#             ]
#             glob_ignore = ":".join(glob_ignore_list)
#             subprocess_run(
#                 ["bash", "-c", f"export GLOBIGNORE={glob_ignore}; rm -rf {data_folder}/*; unset GLOBIGNORE"], log_file
#             )
#
#             # Copy everything from backup location to the data folder, excluding the ignored files
#             subprocess_run(["bash", "-c", f"cp -a {backup_location}/* {data_folder}/"], log_file)
#     logger.info("Data folder backup restored.")
