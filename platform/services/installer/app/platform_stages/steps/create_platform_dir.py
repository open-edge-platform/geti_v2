# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import logging
import subprocess

from cli_utils.platform_logs import subprocess_run
from constants.paths import INSTALL_LOG_FILE_PATH, PLATFORM_INSTALL_PATH
from platform_stages.steps.errors import CreatePlatformDirectoryError

logger = logging.getLogger(__name__)


def create_platform_dir(platform_install_path: str = PLATFORM_INSTALL_PATH) -> None:
    """
    Creates a platform directory for installation purposes
    """

    logger.info(f"Creating platform install path at '{platform_install_path}'")
    with open(INSTALL_LOG_FILE_PATH, "a", encoding="utf-8") as log_file:
        try:
            subprocess_run(
                [
                    "mkdir",
                    "-p",
                    platform_install_path,
                ],
                log_file,
            )
        except subprocess.CalledProcessError as ex:
            raise CreatePlatformDirectoryError from ex
    logger.info("Platform path created.")
