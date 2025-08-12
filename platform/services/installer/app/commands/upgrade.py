# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
CLI command for upgrade operation.
"""

import logging
import os
import shutil
import signal
import sys
from functools import partial
from typing import TYPE_CHECKING

import rich_click as click
import yaml.parser

from checks.dns import check_dns_ipv4_handling
from checks.errors import CumulativeCheckError
from checks.internet import check_internet_connection
from checks.k3s import check_if_k3s_default_config_file_present
from checks.k8s import (
    check_istio_ingress_gateway_installation,
    check_istio_ingress_gateway_version,
    check_k8s_connection,
    check_k8s_gpu_requirements,
)
from checks.os import check_os_version
from checks.platform import check_platform_version
from checks.resources import check_gpu_driver_version, check_upgrade_storage_requirements
from checks.tools import check_tools_configuration
from checks.user import check_user_id
from cli_utils.checks import CROSS_MARK, TICK_MARK, run_checks
from cli_utils.platform_logs import configure_logging, create_logs_dir
from cli_utils.prompts import prompt_for_configuration_value
from cli_utils.spinner import click_spinner
from configuration_models.upgrade_config import UpgradeConfig
from constants.k3s import UPGRADE_K3S
from constants.paths import DATA_CAN_BE_RESTORED_FLAG, K3S_KUBECONFIG_PATH, OFFLINE_TOOLS_DIR, PLATFORM_INSTALL_PATH
from k3s.detect_k3s import is_kubernetes_running_on_k3s
from k3s.install import K3SInstallationError, install_k3s
from platform_configuration.errors import ConfigurationError
from platform_configuration.features import FeatureFlag, is_feature_flag_enabled
from platform_configuration.platform import get_data_folder_path, is_grafana_installed
from platform_configuration.versions import (
    get_current_platform_version,
    get_target_platform_version,
    get_target_product_build,
)
from platform_stages.steps.errors import DownloadSystemPackagesError, StepsError
from platform_stages.steps.install_system_packages import install_system_packages
from platform_stages.upgrade import upgrade_platform
from platform_utils.grafana import flush_ingesters as flush_lgtm_stack
from platform_utils.management.data_folder import backup_data_folder, restore_data_folder
from platform_utils.management.management import restore_platform, stop_platform
from platform_utils.management.state import (
    cluster_info_dump,
    kill_all_k3s,
    restart_k3s,
    restore_k3s_state,
    save_k3s_state,
)
from texts.checks import (
    DNSChecksTexts,
    InternetConnectionChecksTexts,
    K3SChecksTexts,
    K8SChecksTexts,
    LocalOSChecksTexts,
    LocalUserChecksTexts,
    PlatformCheckTexts,
    ResourcesChecksTexts,
    ToolsChecksTexts,
)
from texts.upgrade_command import UpgradeCmdConfirmationTexts, UpgradeCmdTexts
from validators.errors import ValidationError

if TYPE_CHECKING:
    from collections.abc import Callable

logger = logging.getLogger(__name__)

handler_state = {"can_be_aborted": False, "already_triggered": False}


class PrepareUpgradeException(Exception):
    """Failure across 'prepare_upgrade' step"""


def custom_interrupt_handler_with_args(  # noqa: ANN201
    handler_state: dict,
    config: UpgradeConfig,
    location: str,
    data_folder: str,
):
    """
    Handle installation interruption
    """

    def handler(sig, frame):  # noqa: ARG001, ANN001
        if handler_state["already_triggered"]:
            return

        handler_state["already_triggered"] = True

        if handler_state["can_be_aborted"]:
            logger.warning("Upgrade of the platform was aborted.")
            click.secho("\n" + UpgradeCmdTexts.upgrade_aborted, fg="yellow")
            rollback_platform(config, location, data_folder)
            click.secho("\n" + UpgradeCmdTexts.revert_succeeded, fg="green")
            sys.exit(0)
        else:
            logger.warning("Upgrade of k3s cannot be aborted.")
            click.secho("\n" + UpgradeCmdTexts.k3s_upgrade_in_progress, fg="yellow")
            handler_state["already_triggered"] = False

    return handler


def set_custom_signal_handler(handler_state: dict, config: UpgradeConfig, location: str, data_folder: str) -> None:
    """
    Set custom signal handler for installation.
    """
    handler = custom_interrupt_handler_with_args(handler_state, config, location, data_folder)
    signal.signal(signal.SIGINT, handler)


def reset_custom_signal_handler(handler_state: dict) -> None:
    """
    Reset custom signal handler for installation
    """
    handler_state.update(
        {
            "can_be_aborted": True,
            "already_triggered": False,
        }
    )


def initial_checks(config: UpgradeConfig) -> None:
    """
    Run initial checks, executed before upgrade wizard prompts.
    """
    checks: list[tuple[str, Callable]] = [
        (LocalUserChecksTexts.user_check_start, check_user_id),
        (LocalOSChecksTexts.os_check_start, partial(check_os_version, config=config)),
        (
            InternetConnectionChecksTexts.internet_connection_check_start,
            partial(check_internet_connection, config=config),
        ),
        (DNSChecksTexts.dns_ipv4_config_check, partial(check_dns_ipv4_handling, config=config)),
    ]

    if not config.offer_k8s_option.value:
        checks += [(K3SChecksTexts.check_k3s_default_config_exists, check_if_k3s_default_config_file_present)]

    if not is_feature_flag_enabled(FeatureFlag.OFFLINE_INSTALLATION):
        checks.append((ToolsChecksTexts.req_tools_check_start, check_tools_configuration))

    run_checks(checks=checks)


def upgrade_checks(config: UpgradeConfig) -> None:
    """
    Run pre-upgrade checks.
    """
    checks: list[tuple[str, Callable]] = [
        (
            K8SChecksTexts.connection_check_start,
            partial(check_k8s_connection, kubeconfig_path=config.kube_config.value),
        ),
        (
            K8SChecksTexts.gpu_requirements_check_start,
            partial(
                check_k8s_gpu_requirements,
                config=config,
            ),
        ),
        (
            ResourcesChecksTexts.gpu_driver_version_check_start,
            partial(
                check_gpu_driver_version,
                config=config,
            ),
        ),
        (
            K8SChecksTexts.storage_requirements_check_start,
            partial(check_upgrade_storage_requirements, config=config),
        ),
        (
            PlatformCheckTexts.platform_version_check_start,
            partial(check_platform_version, kubeconfig_path=config.kube_config.value),
        ),
    ]
    if not config.running_on_k3s.value:
        istio_ingress_checks: list[tuple[str, Callable]] = [
            (
                K8SChecksTexts.istio_ingress_installed_check_start,
                partial(check_istio_ingress_gateway_installation, kubeconfig_path=config.kube_config.value),
            ),
            (K8SChecksTexts.istio_ingress_version_check_start, check_istio_ingress_gateway_version),
        ]
        checks.extend(istio_ingress_checks)
    run_checks(checks=checks)


def run_initial_checks(config: UpgradeConfig) -> None:
    """
    Run initial_checks, print a message and terminate script execution on error.
    """
    try:
        initial_checks(config)
    except CumulativeCheckError:
        click.echo(UpgradeCmdTexts.checks_error_message)
        sys.exit(1)


def run_upgrade_checks(config: UpgradeConfig) -> None:
    """
    Run upgrade_checks, print a message and terminate script execution on error.
    """
    try:
        upgrade_checks(config=config)
    except CumulativeCheckError:
        click.echo(UpgradeCmdTexts.checks_error_message)
        sys.exit(1)


def prompt_for_upgrade_config(config: UpgradeConfig) -> None:
    """
    Prompt user for upgrade configuration
    """
    if config.offer_k8s_option.value:
        prompt_for_configuration_value(
            config.kube_config,
            UpgradeCmdTexts.kube_config_prompt,
            show_default=False,
            default=K3S_KUBECONFIG_PATH,
        )

    # Apply overrides, to know which of the subsequent prompts to display.
    apply_config_overrides(config)

    if is_grafana_installed(config.kube_config.value):
        # Enable the Grafana stack implicitly, to allow chart upgrades.
        config.grafana_enabled.value = True
    elif config.install_telemetry_stack.value:
        prompt_for_configuration_value(config.grafana_enabled, UpgradeCmdTexts.grafana_config_prompt)


def display_final_confirmation(config: UpgradeConfig) -> None:
    """
    Display the gathered data and ask for the confirmation.
    """
    click.echo()
    click.echo(UpgradeCmdConfirmationTexts.kube_config_message.format(kubeconfig=config.kube_config.value))

    if config.skip_backup.value:
        click.echo(UpgradeCmdConfirmationTexts.backup_skipped_message)

    if config.backup_location.value:
        click.echo(UpgradeCmdConfirmationTexts.backup_location_message.format(location=config.backup_location.value))
        click.secho(UpgradeCmdTexts.keep_backup_location_message, fg="yellow", nl=True)

    if not is_grafana_installed(config.kube_config.value):
        if config.grafana_enabled.value:
            click.echo(UpgradeCmdConfirmationTexts.confirm_grafana_enabled_message)
        else:
            click.echo(UpgradeCmdConfirmationTexts.confirm_grafana_disabled_message)

    logger.debug(UpgradeCmdConfirmationTexts.kube_config_message.format(kubeconfig=config.kube_config.value))
    current_version = get_current_platform_version(config.kube_config.value)
    target_version = get_target_platform_version()
    click.echo()
    click.echo(
        UpgradeCmdConfirmationTexts.version_change_message.format(
            current_version=current_version, target_version=target_version
        )
    )
    click.echo()
    click.confirm(UpgradeCmdConfirmationTexts.upgrade_prompt, default=True, abort=True)
    logger.debug(
        UpgradeCmdConfirmationTexts.version_change_message.format(
            current_version=current_version, target_version=target_version
        )
    )


def load_upgrade_config_from_yaml(config: UpgradeConfig, config_file_path: str) -> None:
    """
    Load UpgradeConfig values from yaml config file.
    Terminates script execution on failure.
    """
    click.echo(UpgradeCmdTexts.loading_config_file_message, nl=False)
    logger.debug(UpgradeCmdTexts.loading_config_file_message)
    # noinspection PyUnresolvedReferences
    try:
        config.load_config_from_yaml(config_file_path, validate=True)
        config.grafana_enabled.value = bool(config.grafana_enabled.value)
        click.secho(f" {TICK_MARK}", fg="green")
    except ValidationError as val_err:
        err_msg = "\n - ".join(val_err.error_messages)
        logger.exception(err_msg)
        click.secho(f" {CROSS_MARK}", fg="red")
        click.secho(UpgradeCmdTexts.config_file_validation_failed.format(err_msg=err_msg), fg="red")
        sys.exit(1)
    except (yaml.parser.ParserError, IsADirectoryError, yaml.scanner.ScannerError) as error:
        logger.exception(str(error))
        click.secho(f" {CROSS_MARK}", fg="red")
        click.secho(UpgradeCmdTexts.config_file_parsing_failed.format(error=error), fg="red")
        sys.exit(1)


def apply_config_overrides(config: UpgradeConfig) -> None:
    """
    Override configuration based on the platform's handler_state.
    """
    try:
        if is_grafana_installed(config.kube_config.value):
            # Enable the Grafana stack implicitly, to allow chart upgrades.
            config.grafana_enabled.value = True
    except ConfigurationError as err:
        logger.exception(err)
        click.secho(f" {CROSS_MARK}", fg="red")
        click.secho("\n" + UpgradeCmdTexts.checks_error_message, fg="red")
        sys.exit(1)


def execute_upgrade(config: UpgradeConfig) -> None:  # noqa: PLR0915
    """
    Execute platform upgrade with passed configuration.
    """
    click.echo(UpgradeCmdTexts.execution_start_message)

    current_platform_version = config.current_platform_version.value = get_current_platform_version(
        config.kube_config.value
    )
    data_folder = config.data_folder.value = get_data_folder_path(config.kube_config.value)
    location = config.backup_location.value if config.backup_location.value else data_folder

    handler_state = {"can_be_aborted": False, "already_triggered": False}
    set_custom_signal_handler(handler_state, config, location, data_folder)

    try:
        click.echo(UpgradeCmdTexts.sys_pkgs_installing)
        install_system_packages(config)
        click.secho(UpgradeCmdTexts.sys_pkgs_installation_succeeded, fg="green")
    except DownloadSystemPackagesError:
        logger.exception("Error during system packages installation.")
        click.secho(UpgradeCmdTexts.sys_pkgs_installation_failed, fg="red")
        sys.exit(1)

    if UPGRADE_K3S and config.running_on_k3s.value:
        perform_k3s_upgrade(config)

    reset_custom_signal_handler(handler_state)

    try:
        prepare_upgrade(config, current_platform_version, data_folder, location)
        perform_upgrade(config)
    except StepsError:
        logger.error("Platform upgrade failed")
        cluster_info_dump(kubeconfig=config.kube_config.value)
        click.secho("\n" + UpgradeCmdTexts.upgrade_failed, fg="red")
        click.secho("\nReverting to the previous state...", fg="yellow")
        rollback_platform(config, location, data_folder)
        click.secho("\n" + UpgradeCmdTexts.revert_succeeded, fg="green")
        sys.exit(1)
    except PrepareUpgradeException:
        logger.error("Platform preparation failed.")
        click.secho("\n" + UpgradeCmdTexts.preparation_failed, fg="red")
        click.secho("\nReverting to the previous state...", fg="yellow")
        rollback_platform(config, location, data_folder)
        click.secho("\n" + UpgradeCmdTexts.revert_succeeded, fg="green")
        sys.exit(1)
    finally:
        logger.info("Running finalization tasks.")
        click.echo(UpgradeCmdTexts.finalization_start)
        shutil.rmtree(PLATFORM_INSTALL_PATH, ignore_errors=True)
        if config.lightweight_installer.value:
            # remove 'tools' dir on failure,
            # to be able to re-run without any side effects
            shutil.rmtree(OFFLINE_TOOLS_DIR)
        try:
            with click_spinner.spinner():
                restore_platform(config=config)
        except Exception:
            logger.error("Finalization tasks failed.")
            click.echo(UpgradeCmdTexts.finalization_failed)
            sys.exit(1)
        click.echo(UpgradeCmdTexts.finalization_succeeded)
        logger.info("Finalization tasks finished.")

    if config.backup_location.value:
        click.secho("\n" + UpgradeCmdTexts.upgrade_succeeded_backup_location, fg="green")
        return

    click.secho("\n" + UpgradeCmdTexts.upgrade_succeeded, fg="green")


def perform_k3s_upgrade(config: UpgradeConfig) -> None:
    """
    Perform K3s upgrade with spinner and error handling.
    """
    logger.info("Upgrading k3s.")
    click.echo(UpgradeCmdTexts.k3s_upgrade)
    logger.info(UpgradeCmdTexts.k3s_upgrade)
    try:
        with click_spinner.spinner():
            install_k3s(setup_remote_kubeconfig=True)
    except K3SInstallationError:
        logger.exception("Error during k3s upgrade.")
        click.echo(UpgradeCmdTexts.k3s_upgrade_failed)
        if config.lightweight_installer.value:
            # remove 'tools' dir on failure,
            # to be able to re-run without any side effects
            shutil.rmtree(OFFLINE_TOOLS_DIR)
        sys.exit(1)
    click.echo(UpgradeCmdTexts.k3s_upgrade_succeeded)
    logger.info(UpgradeCmdTexts.k3s_upgrade_succeeded)
    logger.info("Upgrade of k3s finished.")


def prepare_upgrade(config: UpgradeConfig, current_platform_version: str, data_folder: str, location: str) -> None:
    """
    Prepare platform upgrade by flushing stack, saving state, stopping platform, and backing up data.
    """
    click.echo(UpgradeCmdTexts.logs_location_message)
    click.echo(UpgradeCmdTexts.preparation_start)
    logger.info("Preparing the platform for upgrade.")
    try:
        with click_spinner.spinner():
            flush_lgtm_stack(kube_config=config.kube_config.value)
            if not config.skip_backup.value:
                save_k3s_state()
            stop_platform(config=config)
            if not config.skip_backup.value:
                backup_data_folder(
                    location=location,
                    data_folder=data_folder,
                    current_platform_version=current_platform_version,
                )
    except Exception as ex:
        raise PrepareUpgradeException from ex
    click.echo(UpgradeCmdTexts.preparation_succeeded)
    logger.info("Platform preparation finished.")


def perform_upgrade(config: UpgradeConfig) -> None:
    """
    Perform the platform upgrade.
    """
    logger.info("Running upgrade of the platform.")
    try:
        upgrade_platform(config=config)
    except Exception:
        logger.info("Platform upgrade failed.")
        raise
    logger.info("Platform upgrade finished.")


def rollback_platform(config: UpgradeConfig, location: str, data_folder: str) -> None:
    """
    Rollback the platform
    """
    logger.info("Rolling back the platform.")
    current_platform_version = config.current_platform_version.value
    backup_location = os.path.join(location, f"backup_data_{current_platform_version}")
    can_be_restored_flag = os.path.exists(os.path.join(backup_location, DATA_CAN_BE_RESTORED_FLAG))
    with click_spinner.spinner():
        if not config.skip_backup.value and can_be_restored_flag:
            kill_all_k3s()
            restore_data_folder(
                backup_location=backup_location,
                data_folder=data_folder,
            )
            restore_k3s_state()
        else:
            restart_k3s()
    logger.info("Platform rollback finished.")


@click.command()
@click.option("--config-file", type=click.Path(exists=True), required=False, help="Config file with upgrade parameters")
@click.option(
    "--install-telemetry-stack",
    default=False,
    required=False,
    is_flag=True,
    help="If flag is set - telemetry stack will be installed. By default the stack is not installed.",
)
def upgrade(config_file: str | None = None, install_telemetry_stack: bool = False) -> None:
    """
    Upgrade platform.
    """
    click.echo(UpgradeCmdTexts.start_message)
    create_logs_dir()
    configure_logging()
    logger.info(f"{get_target_product_build()} {UpgradeCmdTexts.start_message}")
    config = UpgradeConfig(interactive_mode=not bool(config_file), install_telemetry_stack=install_telemetry_stack)
    run_initial_checks(config)
    if config_file:
        load_upgrade_config_from_yaml(config, config_file)
        apply_config_overrides(config)
        config.running_on_k3s.value = is_kubernetes_running_on_k3s(config.kube_config.value)
        run_upgrade_checks(config)
    else:
        prompt_for_upgrade_config(config)
        config.running_on_k3s.value = is_kubernetes_running_on_k3s(config.kube_config.value)
        run_upgrade_checks(config)
        display_final_confirmation(config)

    execute_upgrade(config)
