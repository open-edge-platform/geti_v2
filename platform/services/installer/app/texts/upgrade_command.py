# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
Strings that are shown to the user by upgrade command.
"""

from constants.paths import K3S_KUBECONFIG_PATH


class UpgradeCmdTexts:
    """
    Contains strings shown to the user by upgrade command.
    """

    start_message = "Running platform upgrade..."
    kube_config_prompt = f"Path to kubeconfig file (press Enter for {K3S_KUBECONFIG_PATH})"
    kube_config_missing = "Intel Geti probably not installed here. {error}"
    loading_config_file_message = "Reading and validating provided configuration file..."
    config_file_validation_failed = "Failed to validate the configuration file: \n - {err_msg}"
    config_file_parsing_failed = "Failed to parse provided configuration file: {error}"
    execution_start_message = "Executing upgrade..."
    checks_error_message = "Pre-upgrade checks failed, aborting upgrade."
    logs_location_message = "Detailed logs can be found in: platform_logs/install.log"
    preparation_start = "Preparing platform for upgrade..."
    preparation_succeeded = "Platform preparation finished successfully."
    preparation_failed = "Platform preparation failed. Look for errors in the log."
    upgrade_start = "Upgrading platform"
    upgrade_succeeded = "Platform upgrade finished successfully."
    upgrade_succeeded_backup_location = (
        "Platform upgrade finished successfully. You may now safely disconnect the backup location."
    )
    upgrade_failed = "Platform upgrade failed. Look for errors in the log."
    upgrade_aborted = "Upgrade aborted. Reverting to the previous state..."
    revert_succeeded = "Successfully reverted to the previous state."
    finalization_start = "Running finalization tasks..."
    finalization_succeeded = "Finalization tasks finished successfully."
    finalization_failed = "Finalization tasks failed. Look for errors in the log."
    k3s_upgrade = "Upgrading k3s. Detailed logs can be found in: platform_logs/k3s_install.log."
    k3s_upgrade_in_progress = "k3s upgrade in progress, keyboard interrupt is disabled."
    k3s_upgrade_succeeded = "k3s upgraded successfully. Path to admin kubeconfig: /etc/rancher/k3s/k3s.yaml"
    k3s_upgrade_failed = "k3s upgrade failed. Look for errors in the log."
    sys_pkgs_installing = "Installing system packages. Detailed logs can be found in: platform_logs/install.log."
    sys_pkgs_installation_succeeded = "system packages installed successfully."
    sys_pkgs_installation_failed = "system packages installation failed. Look for errors in the log."
    grafana_config_prompt = (
        "Do you want to install the Grafana stack (not recommended on setups meeting only the minimum HW requirements)?"
    )
    skip_backup_prompt = (
        "You can either skip the backup (highly not recommended), or provide a path to a folder to copy the data.\n"
        "Note: If you choose to skip the backup, "
        "the restore of the platform state will not be possible in case of an upgrade failure.\n"
        "Do you want to skip the backup?"
    )
    backup_location_prompt = "Path to folder to copy the backup data"
    keep_backup_location_message = (
        "Please refrain from removing the backup location until the upgrade process is finished."
    )


class UpgradeCmdConfirmationTexts:
    """
    Texts displayed on final confirmation prompt, before executing upgrade.
    """

    kube_config_message = "Platform will be upgraded on Kubernetes cluster indicated in: {kubeconfig}"
    upgrade_prompt = "Do you want to upgrade platform to a new version?"
    version_change_message = "Upgrading platform from version: {current_version} to: {target_version}"

    confirm_grafana_enabled_message = "The Grafana stack will be configured."
    confirm_grafana_disabled_message = "The Grafana stack will not be configured."

    backup_skipped_message = "The backup will be skipped."
    backup_location_message = "The backup will be stored under '{location}' directory."
