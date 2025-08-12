# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import logging
import subprocess

from cli_utils.platform_logs import subprocess_run
from configuration_models.install_config import InstallationConfig
from configuration_models.upgrade_config import UpgradeConfig
from constants.paths import INSTALL_LOG_FILE_PATH, INSTALLER_DIR
from platform_stages.steps.errors import ExtractRegistryDataError

logger = logging.getLogger(__name__)


def extract_registry_data(config: InstallationConfig | UpgradeConfig) -> None:
    """
    Extract registry data for installation purposes
    """
    if not config.lightweight_installer.value:
        registry_data_dir = f"{config.data_folder.value}/registry"

        logger.info(f"Creating registry data directory: '{registry_data_dir}'")
        with open(INSTALL_LOG_FILE_PATH, "a", encoding="utf-8") as log_file:
            try:
                subprocess_run(
                    ["mkdir", "-p", registry_data_dir],
                    log_file,
                )
            except subprocess.CalledProcessError as ex:
                raise ExtractRegistryDataError from ex
        logger.info("Registry data directory created.")

        logger.info("Extracting registry data...")
        with open(INSTALL_LOG_FILE_PATH, "a", encoding="utf-8") as log_file:
            try:
                subprocess_run(
                    [
                        "tar",
                        "-xvf",
                        "registry_data.tar.gz",
                        "--use-compress-program=pigz",
                        "-C",
                        f"{registry_data_dir}",
                    ],
                    log_file,
                    cwd=INSTALLER_DIR,
                )
            except subprocess.CalledProcessError as ex:
                raise ExtractRegistryDataError from ex
        logger.info("Registry data extracted.")
    else:
        logger.info("External registry used, skipping internal registry extract")
