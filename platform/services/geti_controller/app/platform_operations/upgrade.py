# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import fcntl
import json
import logging
import os

from constants.platform import UPGRADE_FILE_PATH
from platform_operations.cluster import deploy_service_job

logger = logging.getLogger(__name__)


def commence_upgrade(
    source_version: str,
    target_version: str,
    registry: str,
    image_tag: str,
    manifest_version: str,
    direction: str,
) -> None:
    """Commence the upgrade process by deploying the service job and updating the progress file."""
    update_upgrade_progress(
        {
            "source_version": source_version,
            "target_version": target_version,
            "progress_percentage": 0,
            "status": "RUNNING",
            "message": "Upgrade process has started.",
        }
    )

    deploy_service_job(
        registry=registry,
        image_tag=image_tag,
        manifest_version=manifest_version,
        direction=direction,
    )


def update_upgrade_progress(patch: dict) -> dict:
    """
    Update the upgrade progress file with the provided patch data.
    If the file does not exist, it will be created with default values used to fill in missing from the patch.
    """
    mode = "r+" if os.path.isfile(UPGRADE_FILE_PATH) else "w+"
    try:
        with open(UPGRADE_FILE_PATH, mode) as f:
            # lock a file and read existing data to prevent TOCTOU errors
            fcntl.flock(f, fcntl.LOCK_EX)
            try:
                stored = json.load(f)
            except json.JSONDecodeError:
                stored = {}

            data = _fill_in_defaults(stored) | patch

            # rewind file pointer to the beginning, overwrite existing data and free the lock
            f.seek(0)
            json.dump(data, f, indent=2)
            f.truncate()
            fcntl.flock(f, fcntl.LOCK_UN)
    except (IsADirectoryError, PermissionError):
        logger.exception(f"Unable to open {UPGRADE_FILE_PATH}. Progress will not be saved.")

    return data


def get_upgrade_progress() -> dict:
    """Retrieve the upgrade progress from the stored file."""
    stored = {}
    try:
        with open(UPGRADE_FILE_PATH) as f:
            stored = json.load(f)
    except FileNotFoundError:
        logger.info(f"Stored upgrade data file {UPGRADE_FILE_PATH} not found. Using default values.")
    except (IsADirectoryError, PermissionError):
        logger.exception(f"Unable to open {UPGRADE_FILE_PATH}. Using default values.")
    except json.JSONDecodeError:
        logger.exception(f"Failed to decode JSON from {UPGRADE_FILE_PATH}. Using default values.")

    return _fill_in_defaults(stored)


def _fill_in_defaults(stored: dict) -> dict:
    defaults = {
        "source_version": "",
        "target_version": "",
        "progress_percentage": 0,
        "status": "NOT_RUNNING",
        "message": "",
    }

    return defaults | stored
