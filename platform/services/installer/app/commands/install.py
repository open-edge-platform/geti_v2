# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
CLI command for install operation.
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
from checks.k8s import (
    check_istio_ingress_gateway_installation,
    check_istio_ingress_gateway_version,
    check_k8s_cluster_version,
    check_k8s_connection,
    check_k8s_cpu_requirements,
    check_k8s_gpu_requirements,
    check_k8s_is_not_installed,
    check_k8s_memory_requirements,
    check_metrics_server_installed,
    check_metrics_server_version,
)
from checks.os import check_os_version
from checks.platform import check_if_platform_installed
from checks.ports import check_required_ports_availability
from checks.resources import (
    check_gpu_driver_version,
    check_local_cpu,
    check_local_disk,
    check_local_gpu,
    check_local_mem,
)
from checks.tools import check_tools_configuration
from checks.user import check_user_id
from cli_utils.checks import CROSS_MARK, TICK_MARK, run_checks
from cli_utils.credentials import hash_ldap_password
from cli_utils.platform_logs import configure_logging, create_logs_dir
from cli_utils.prompts import prompt_for_configuration_value
from cli_utils.spinner import click_spinner
from configuration_models.install_config import InstallationConfig
from constants.paths import (
    K3S_INSTALLATION_MARK_FILEPATH,
    K3S_KUBECONFIG_PATH,
    OFFLINE_TOOLS_DIR,
    PLATFORM_INSTALL_PATH,
)
from k3s.detect_ip import get_first_public_ip, get_master_node_ip_address
from k3s.detect_k3s import is_kubernetes_running_on_k3s
from k3s.install import K3SInstallationError, install_k3s
from k3s.uninstall import uninstall_k3s
from platform_configuration.features import FeatureFlag, is_feature_flag_enabled
from platform_configuration.versions import get_target_product_build
from platform_stages.install import install_platform
from platform_stages.steps.errors import DownloadSystemPackagesError, StepsError
from platform_stages.steps.install_system_packages import install_system_packages
from platform_utils.management.state import cluster_info_dump
from texts.checks import (
    DNSChecksTexts,
    InternetConnectionChecksTexts,
    K8SChecksTexts,
    LocalOSChecksTexts,
    LocalUserChecksTexts,
    PlatformCheckTexts,
    PortsAvailabilityCheckTexts,
    ResourcesChecksTexts,
    ToolsChecksTexts,
)
from texts.install_command import InstallCmdConfirmationTexts, InstallCmdTexts
from validators.errors import ValidationError

if TYPE_CHECKING:
    from collections.abc import Callable

logger = logging.getLogger(__name__)


handler_state = {"can_be_aborted": False, "already_triggered": False}


def custom_interrupt_handler_with_args(handler_state: dict, data_folder: str):  # noqa: ANN201
    """
    Handle installation interruption
    """

    def handler(sig, frame):  # noqa: ARG001, ANN001
        if handler_state["already_triggered"]:
            return

        handler_state["already_triggered"] = True

        if handler_state["can_be_aborted"]:
            logger.warning("Installation of the platform was aborted.")
            click.secho("\n" + InstallCmdTexts.installation_aborted, fg="yellow")
            with click_spinner.spinner():
                uninstall_k3s(delete_data=True, data_folder=data_folder)
            click.secho("\n" + InstallCmdTexts.installation_aborted_succeeded, fg="green")
            sys.exit(0)
        else:
            logger.warning("k3s installation cannot be aborted")
            click.secho("\n" + InstallCmdTexts.k3s_installation_in_progress, fg="yellow")
            handler_state["already_triggered"] = False

    return handler


def set_custom_signal_handler(handler_state: dict, data_folder: str) -> None:
    """
    Set custom signal handler for installation.
    """
    handler = custom_interrupt_handler_with_args(handler_state, data_folder)
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


def initial_checks(config: InstallationConfig) -> None:
    """
    Run initial checks, executed before install wizard prompts.
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

    run_checks(checks=checks)


def install_checks(config: InstallationConfig) -> None:
    """
    Run pre-installation checks.
    """
    checks: list[tuple[str, Callable]]
    if config.install_on_existing_k8s:
        istio_ingress_checks: list[tuple[str, Callable]] = [
            (
                K8SChecksTexts.istio_ingress_installed_check_start,
                partial(check_istio_ingress_gateway_installation, kubeconfig_path=config.kube_config.value),
            ),
            (K8SChecksTexts.istio_ingress_version_check_start, check_istio_ingress_gateway_version),
        ]

        checks = [
            (
                K8SChecksTexts.connection_check_start,
                partial(check_k8s_connection, kubeconfig_path=config.kube_config.value),
            ),
            (
                K8SChecksTexts.cluster_version_check_start,
                partial(check_k8s_cluster_version, kubeconfig_path=config.kube_config.value),
            ),
            (
                PlatformCheckTexts.platform_installed_check_start,
                partial(check_if_platform_installed, kubeconfig_path=config.kube_config.value),
            ),
            (
                K8SChecksTexts.mem_requirements_check_start,
                partial(check_k8s_memory_requirements, kubeconfig_path=config.kube_config.value),
            ),
            (
                K8SChecksTexts.cpu_requirements_check_start,
                partial(check_k8s_cpu_requirements, kubeconfig_path=config.kube_config.value),
            ),
            (
                K8SChecksTexts.gpu_requirements_check_start,
                partial(
                    check_k8s_gpu_requirements,
                    config=config,
                ),
            ),
            (
                K8SChecksTexts.metrics_server_installed_check_start,
                partial(check_metrics_server_installed, kubeconfig_path=config.kube_config.value),
            ),
            (
                K8SChecksTexts.metrics_server_version_check_start,
                partial(check_metrics_server_version, kubeconfig_path=config.kube_config.value),
            ),
        ]
        checks.extend(istio_ingress_checks)

    else:
        checks = [
            (ResourcesChecksTexts.resources_check_cpu, check_local_cpu),
            (ResourcesChecksTexts.resources_check_mem, check_local_mem),
            (ResourcesChecksTexts.resources_check_disk, check_local_disk),
            # (
            #     ResourcesChecksTexts.gpu_driver_check_start,
            #     partial(check_local_gpu_driver, gpu_support=config.gpu_support.value),
            # ),
            (
                ResourcesChecksTexts.gpu_requirements_check_start,
                partial(check_local_gpu, config=config),
            ),
            (
                ResourcesChecksTexts.gpu_driver_version_check_start,
                partial(check_gpu_driver_version, config=config),
            ),
            (K8SChecksTexts.already_installed_k8s_check_start, check_k8s_is_not_installed),
            (PortsAvailabilityCheckTexts.ports_availability_check_start, check_required_ports_availability),
        ]
        if not is_feature_flag_enabled(FeatureFlag.OFFLINE_INSTALLATION):
            checks.append((ToolsChecksTexts.req_tools_check_start, check_tools_configuration))

    run_checks(checks=checks)


def prompt_for_mailserver_config(config: InstallationConfig) -> None:
    """
    Prompt user for mailserver configuration.
    """
    if click.confirm(InstallCmdTexts.smtp_config_prompt, default=False):
        prompt_for_configuration_value(config.smtp_address, InstallCmdTexts.smtp_address_prompt)
        prompt_for_configuration_value(
            config.smtp_port, InstallCmdTexts.smtp_port_prompt, default=587, show_default=False
        )
        prompt_for_configuration_value(config.smtp_username, InstallCmdTexts.smtp_username_prompt)
        prompt_for_configuration_value(config.smtp_password, InstallCmdTexts.smtp_password_prompt, hide_input=True)
        prompt_for_configuration_value(config.sender_address, InstallCmdTexts.smtp_sender_email_prompt)
        prompt_for_configuration_value(config.sender_name, InstallCmdTexts.smtp_sender_name_prompt)

        try:
            click.echo(
                InstallCmdTexts.smtp_checking_connection.format(
                    address=config.smtp_address.value, port=config.smtp_port.value
                ),
                nl=False,
            )
            with click_spinner.spinner():
                config.validate_smpt_configuration()
            click.echo()
        except ValidationError:
            click.secho(
                InstallCmdTexts.smtp_connection_failed.format(
                    address=config.smtp_address.value, port=config.smtp_port.value
                ),
                fg="red",
            )
            for smtp_field in config.get_smtp_configuration_fields():
                smtp_field.value = None
            prompt_for_mailserver_config(config)


def prompt_for_installation_config(config: InstallationConfig) -> None:
    """
    Prompt user for installation configuration
    """
    prompt_for_configuration_value(config.user_login, InstallCmdTexts.username_prompt)
    prompt_for_configuration_value(
        config.user_password, InstallCmdTexts.password_prompt, hide_input=True, confirmation_prompt=True
    )
    config.user_pass_sha.value = hash_ldap_password(config.user_password.value)

    prompt_for_mailserver_config(config=config)

    if click.confirm(InstallCmdTexts.custom_certificate_prompt, default=False):
        prompt_for_configuration_value(config.cert_file, InstallCmdTexts.cert_file_prompt)
        prompt_for_configuration_value(config.key_file, InstallCmdTexts.key_file_prompt)
    config.data_folder.validation_callback = partial(  # type: ignore
        config.data_folder.validation_callback, is_remote_installation=config.install_on_existing_k8s
    )
    prompt_for_configuration_value(config.data_folder, InstallCmdTexts.data_prompt)

    if config.install_telemetry_stack.value:
        prompt_for_configuration_value(config.grafana_enabled, InstallCmdTexts.grafana_config_prompt)
        if config.grafana_enabled.value and not config.internet_access.value:
            click.confirm(InstallCmdTexts.grafana_no_internet_confirmation_prompt, default=False, abort=True)
            config.grafana_enabled.value = False


def display_final_confirmation(config: InstallationConfig) -> None:
    """
    Display the gathered data and asks for the confirmation.
    """
    click.echo()
    if config.install_on_existing_k8s is True:
        click.echo(InstallCmdConfirmationTexts.confirm_cluster_message.format(kubeconfig=config.kube_config.value))
    else:
        click.echo(InstallCmdConfirmationTexts.confirm_k3s_message)
    click.echo()
    click.echo(InstallCmdConfirmationTexts.confirm_username_message.format(username=config.user_login.value))
    click.echo()

    if config.smtp_address.value:
        click.echo(InstallCmdConfirmationTexts.smtp_config_confirmation_start)
        click.echo(InstallCmdConfirmationTexts.smtp_address.format(address=config.smtp_address.value))
        click.echo(InstallCmdConfirmationTexts.smtp_port.format(port=config.smtp_port.value))
        click.echo(InstallCmdConfirmationTexts.smtp_username.format(username=config.smtp_username.value))
        click.echo(InstallCmdConfirmationTexts.smtp_sender_address.format(sender_address=config.sender_address.value))
        click.echo(InstallCmdConfirmationTexts.smtp_sender_name.format(sender_name=config.sender_name.value))
    else:
        click.echo(InstallCmdConfirmationTexts.smtp_config_missing)

    click.echo()
    if config.grafana_enabled.value:
        click.echo(InstallCmdConfirmationTexts.confirm_grafana_enabled_message)
    else:
        click.echo(InstallCmdConfirmationTexts.confirm_grafana_disabled_message)

    click.echo()
    if config.custom_certificate:
        click.echo(InstallCmdConfirmationTexts.cert_file_message.format(path=config.cert_file.value))
        click.echo(InstallCmdConfirmationTexts.key_file_message.format(path=config.key_file.value))
    else:
        click.echo(InstallCmdConfirmationTexts.no_custom_certificate_message)
    click.echo()
    click.echo(InstallCmdConfirmationTexts.confirm_data_message.format(path=config.data_folder.value))
    click.echo()
    click.confirm(InstallCmdConfirmationTexts.accept_config_prompt, default=True, abort=True)


def execute_installation(config: InstallationConfig) -> None:  # noqa: C901, RUF100
    """
    Execute platform installation with passed configuration.
    """
    click.echo(InstallCmdTexts.execution_start_message)

    handler_state = {"can_be_aborted": False, "already_triggered": False}
    set_custom_signal_handler(handler_state, config.data_folder.value)

    try:
        click.echo(InstallCmdTexts.sys_pkgs_installing)
        install_system_packages(config)
        click.secho(InstallCmdTexts.sys_pkgs_installation_succeeded, fg="green")
    except DownloadSystemPackagesError:
        logger.exception("Error during system packages installation.")
        click.secho(InstallCmdTexts.sys_pkgs_installation_failed, fg="red")
        sys.exit(1)

    if not config.install_on_existing_k8s:
        config.kube_config.value = K3S_KUBECONFIG_PATH

        click.echo(InstallCmdTexts.k3s_installing)
        logger.info(InstallCmdTexts.k3s_installing)
        try:
            with click_spinner.spinner():
                install_k3s()
        except K3SInstallationError:
            logger.exception("Error during k3s installation.")
            click.secho(InstallCmdTexts.k3s_installation_failed, fg="red")
            if config.lightweight_installer.value:
                # remove 'tools' dir on failure,
                # to be able to re-run without any side effects
                shutil.rmtree(OFFLINE_TOOLS_DIR)
            sys.exit(1)
        click.secho(InstallCmdTexts.k3s_installation_succeeded, fg="green")
        logger.info(InstallCmdTexts.k3s_installation_succeeded)
    else:
        config.running_on_k3s.value = is_kubernetes_running_on_k3s(kubeconfig_path=config.kube_config.value)

    reset_custom_signal_handler(handler_state)

    if os.path.exists(K3S_INSTALLATION_MARK_FILEPATH):
        config.master_ip_autodetected.value = get_first_public_ip()

    try:
        install_platform(config=config)
    except StepsError:
        logger.exception("Error during installation.")
        click.secho("\n" + InstallCmdTexts.installation_failed, fg="red")
        cluster_info_dump(kubeconfig=config.kube_config.value)
        sys.exit(1)
    finally:
        shutil.rmtree(PLATFORM_INSTALL_PATH, ignore_errors=True)
        if config.lightweight_installer.value:
            # remove 'tools' dir on failure,
            # to be able to re-run without any side effects
            shutil.rmtree(OFFLINE_TOOLS_DIR)

    if config.master_ip_autodetected.value:
        platform_address = config.master_ip_autodetected.value
    else:
        platform_address = get_master_node_ip_address(kubeconfig_path=config.kube_config.value)

    click.secho("\n" + InstallCmdTexts.installation_succeeded.format(platform_address=platform_address), fg="green")


def load_installation_config_from_yaml(config: InstallationConfig, config_file_path: str) -> None:
    """
    Load InstallationConfig values from yaml config file.
    Terminates script execution on failure.
    """
    click.echo(InstallCmdTexts.loading_config_file_message, nl=False)
    try:
        config.load_config_from_yaml(config_file_path, validate=True)
        config.accept_third_party_licenses.value = bool(config.accept_third_party_licenses.value)
        if not config.accept_third_party_licenses.value:
            click.secho(f" {CROSS_MARK}", fg="red")
            click.secho(InstallCmdTexts.third_party_licenses_error, fg="red")
            sys.exit(1)
        config.user_pass_sha.value = hash_ldap_password(config.user_password.value)
        config.grafana_enabled.value = bool(config.grafana_enabled.value)
        if config.grafana_enabled.value and not config.internet_access.value:
            click.secho(f" {CROSS_MARK}", fg="red")
            click.secho(InstallCmdTexts.grafana_no_internet_error, fg="red")
            sys.exit(1)
        click.secho(f" {TICK_MARK}", fg="green")
    except ValidationError as val_err:
        err_msg = "\n - ".join(val_err.error_messages)
        click.secho(f" {CROSS_MARK}", fg="red")
        click.secho(InstallCmdTexts.config_file_validation_failed.format(err_msg=err_msg), fg="red")
        sys.exit(1)
    except (yaml.parser.ParserError, IsADirectoryError, yaml.scanner.ScannerError, AttributeError) as error:
        click.secho(f" {CROSS_MARK}", fg="red")
        click.secho(InstallCmdTexts.config_file_parsing_failed.format(error=error), fg="red")
        sys.exit(1)


def run_initial_checks(config: InstallationConfig) -> None:
    """
    Run initial_checks, print a message and terminate script execution on error.
    """
    try:
        initial_checks(config=config)
    except CumulativeCheckError:
        click.echo(InstallCmdTexts.checks_error_message)
        sys.exit(1)


def run_installation_checks(config: InstallationConfig) -> None:
    """
    Run install_checks, print a message and terminate script execution on error.
    """
    try:
        install_checks(config=config)
    except CumulativeCheckError:
        click.echo(InstallCmdTexts.checks_error_message)
        sys.exit(1)


@click.command()
@click.option(
    "--config-file",
    type=click.Path(exists=True, resolve_path=True, dir_okay=False),
    required=False,
    help="Config file with installation parameters. When calling installer outside of its directory use absolute path.",
)
@click.option(
    "--install-telemetry-stack",
    default=False,
    required=False,
    is_flag=True,
    help="If flag is set - telemetry stack will be installed. By default the stack is not installed.",
)
def install(config_file: str | None = None, install_telemetry_stack: bool = False) -> None:
    """
    Install platform.
    """
    click.echo(InstallCmdTexts.start_message)
    create_logs_dir()
    configure_logging()
    logger.info(f"{get_target_product_build()} {InstallCmdTexts.start_message}")
    config = InstallationConfig(interactive_mode=not bool(config_file), install_telemetry_stack=install_telemetry_stack)
    run_initial_checks(config=config)
    if config_file:
        load_installation_config_from_yaml(config=config, config_file_path=config_file)
        run_installation_checks(config=config)
    else:
        click.confirm(InstallCmdTexts.third_party_licenses_prompt, default=True, abort=True)
        if config.offer_k8s_option.value and click.confirm(InstallCmdTexts.k8s_prompt):
            prompt_for_configuration_value(config.kube_config, InstallCmdTexts.kube_config_prompt)
        run_installation_checks(config=config)
        prompt_for_installation_config(config)
        display_final_confirmation(config)

    execute_installation(config)
