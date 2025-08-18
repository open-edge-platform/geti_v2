# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
CLI command for uninstall operation.
"""

import logging
import sys
from functools import partial
from typing import TYPE_CHECKING

import rich_click as click
import yaml.parser

from checks.errors import CumulativeCheckError
from checks.internet import check_internet_connection
from checks.k3s import check_if_k3s_installed_by_platform_installer
from checks.user import check_user_id
from cli_utils.checks import CROSS_MARK, TICK_MARK, run_checks
from cli_utils.platform_logs import configure_logging, create_logs_dir
from cli_utils.prompts import prompt_for_configuration_value
from cli_utils.spinner import click_spinner
from configuration_models.uninstall_config import UninstallationConfig
from constants.paths import PLATFORM_LOGS_DIR
from k3s.uninstall import K3SUninstallationError, uninstall_k3s
from texts.checks import InternetConnectionChecksTexts, K3SChecksTexts, LocalUserChecksTexts
from texts.uninstall_command import UninstallCmdConfirmationTexts, UninstallCmdTexts
from validators.errors import ValidationError

if TYPE_CHECKING:
    from collections.abc import Callable

logger = logging.getLogger(__name__)


def initial_checks(config: UninstallationConfig) -> None:
    """
    Run initial checks, executed before uninstall wizard prompts.
    """
    checks: list[tuple[str, Callable]] = [
        (LocalUserChecksTexts.user_check_start, check_user_id),
        (
            InternetConnectionChecksTexts.internet_connection_check_start,
            partial(check_internet_connection, config=config),
        ),
    ]
    run_checks(checks=checks)


def uninstall_checks() -> None:
    """
    Run pre-uninstall checks.
    """
    checks: list[tuple[str, Callable]] = [
        (K3SChecksTexts.check_k3s_installed_by_installer, check_if_k3s_installed_by_platform_installer)
    ]

    run_checks(checks=checks)


def run_initial_checks(config: UninstallationConfig) -> None:
    """
    Run initial_checks, print a message and terminate script execution on error.
    """
    try:
        initial_checks(config=config)
    except CumulativeCheckError:
        click.echo(UninstallCmdTexts.checks_error_message)
        sys.exit(1)


def run_uninstall_checks() -> None:
    """
    Run uninstall_checks, print a message and terminate script execution on error.
    """
    try:
        uninstall_checks()
    except CumulativeCheckError:
        click.echo(UninstallCmdTexts.checks_error_message)
        sys.exit(1)


def prompt_for_uninstallation_config(config: UninstallationConfig) -> None:
    """
    Prompt user for uninstallation configuration
    """
    run_uninstall_checks()
    prompt_for_configuration_value(config.delete_data, UninstallCmdTexts.delete_data_prompt, default=True)


def display_final_confirmation(config: UninstallationConfig) -> None:
    """
    Display the gathered data and ask for the confirmation.
    """
    if config.delete_data.value:
        click.confirm(UninstallCmdConfirmationTexts.uninstall_k3s_data_prompt, default=False, abort=True)
    else:
        click.confirm(UninstallCmdConfirmationTexts.uninstall_k3s_prompt, default=False, abort=True)


def load_uninstallation_config_from_yaml(config: UninstallationConfig, config_file_path: str) -> None:
    """
    Load UninstallationConfig values from yaml config file.
    Terminates script execution on failure.
    """
    click.echo(UninstallCmdTexts.loading_config_file_message, nl=False)
    logger.debug(UninstallCmdTexts.loading_config_file_message)
    try:
        config.load_config_from_yaml(config_file_path, validate=True)
        click.secho(f" {TICK_MARK}", fg="green")
    except ValidationError as val_err:
        err_msg = "\n - ".join(val_err.error_messages)
        logger.exception(err_msg)
        click.secho(f" {CROSS_MARK}", fg="red")
        click.secho(UninstallCmdTexts.config_file_validation_failed.format(err_msg=err_msg), fg="red")
        sys.exit(1)
    except (yaml.parser.ParserError, IsADirectoryError, yaml.scanner.ScannerError) as error:
        logger.exception(str(error))
        click.secho(f" {CROSS_MARK}", fg="red")
        click.secho(UninstallCmdTexts.config_file_parsing_failed.format(error=error), fg="red")
        sys.exit(1)


def execute_uninstallation(config: UninstallationConfig) -> None:
    """
    Execute platform uninstallation with passed configuration.
    """
    click.echo(UninstallCmdTexts.execution_start_message)
    click.echo(UninstallCmdTexts.k3s_uninstallation_start.format(platform_logs_path=PLATFORM_LOGS_DIR))
    logger.info(UninstallCmdTexts.k3s_uninstallation_start.format(platform_logs_path=PLATFORM_LOGS_DIR))
    try:
        with click_spinner.spinner():
            uninstall_k3s(delete_data=config.delete_data.value)
    except K3SUninstallationError:
        logger.exception("Error during k3s uninstallation.")
        click.echo(UninstallCmdTexts.k3s_uninstallation_failed)
        sys.exit(1)
    click.echo(UninstallCmdTexts.k3s_uninstallation_succeeded)


@click.command()
@click.option(
    "--config-file", type=click.Path(exists=True), required=False, help="Config file with uninstallation parameters"
)
def uninstall(config_file: str | None = None) -> None:
    """
    Uninstall platform.
    """
    click.echo(UninstallCmdTexts.start_message)
    create_logs_dir()
    configure_logging()
    logger.info(UninstallCmdTexts.start_message)
    config = UninstallationConfig(interactive_mode=not bool(config_file))
    run_initial_checks(config=config)
    if config_file:
        load_uninstallation_config_from_yaml(config, config_file)
        run_uninstall_checks()
    else:
        prompt_for_uninstallation_config(config)
        display_final_confirmation(config)

    execute_uninstallation(config)
