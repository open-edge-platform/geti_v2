# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import fcntl
import json
import logging
import os
from dataclasses import dataclass

from constants.platform import UPGRADE_FILE_PATH
from platform_operations.cluster import deploy_service_job

logger = logging.getLogger(__name__)


@dataclass
class VersionChangeParams:
    source_version: str
    target_version: str
    registry: str
    source_image_tag: str
    target_image_tag: str
    manifest_version: str
    direction: str
    gpu_label: str | None = None
    render_gid: int | None = None


def commence_version_change(params: VersionChangeParams) -> None:
    """Start the version change process based on the provided parameters."""
    logger.info(f"Starting {params.direction.upper()}")

    update_progress(
        {
            "source_version": params.source_version,
            "target_version": params.target_version,
            "source_image_tag": params.source_image_tag,
            "target_image_tag": params.target_image_tag,
            "progress_percentage": 0,
            "status": "RUNNING",
            "message": f"{params.direction.capitalize()} process has started.",
        }
    )

    deploy_service_job(
        registry=params.registry,
        image_tag=params.target_image_tag,
        manifest_version=params.manifest_version,
        direction=params.direction,
        gpu_label=params.gpu_label,
        render_gid=params.render_gid,
    )


def update_progress(patch: dict) -> dict:
    """
    Update the version change progress file with the provided patch data.
    If the file does not exist, it will be created with default values used to fill in missing from the patch.
    """
    mode = "r+" if os.path.isfile(UPGRADE_FILE_PATH) else "w+"
    logger.info("Updating upgrade progress file at %s with mode %s", UPGRADE_FILE_PATH, mode)
    try:
        with open(UPGRADE_FILE_PATH, mode) as f:
            # lock a file and read existing data to prevent TOCTOU errors
            fcntl.flock(f, fcntl.LOCK_EX)
            try:
                stored = json.load(f)
                logger.info(f"Loaded existing upgrade data: {stored}")
            except json.JSONDecodeError:
                logger.info("NO data was stored in the upgrade file, initializing with defaults.")
                stored = {}

            data = _fill_in_defaults(stored) | patch

            # rewind file pointer to the beginning, overwrite existing data and free the lock
            f.seek(0)
            json.dump(data, f, indent=2)
            f.truncate()
            fcntl.flock(f, fcntl.LOCK_UN)
            logger.info(f"Stored upgrade data: {data}")
    except (IsADirectoryError, PermissionError):
        logger.exception(f"Unable to open {UPGRADE_FILE_PATH}. Progress will not be saved.")
    except FileNotFoundError:
        logger.info(f"File {UPGRADE_FILE_PATH} not found. Progress will not be saved.")
        data = _fill_in_defaults({}) | patch

    return data


def get_version_change_progress() -> dict:
    """Retrieve the version change progress from the stored file."""
    stored = {}
    logger.info(f"Retrieving upgrade progress from {UPGRADE_FILE_PATH}")
    try:
        with open(UPGRADE_FILE_PATH) as f:
            stored = json.load(f)
            logger.info(f"Loaded stored upgrade data: {stored}")
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
        "source_image_tag": "",
        "target_image_tag": "",
        "progress_percentage": 0,
        "status": "NOT_RUNNING",
        "message": "Installation/upgrade job is not running.",
    }

    return defaults | stored
