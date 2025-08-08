# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import signal
from typing import TYPE_CHECKING

import pytest
import yaml
from click.testing import CliRunner

from checks.errors import CumulativeCheckError
from commands.install import (
    custom_interrupt_handler_with_args,
    install,
    reset_custom_signal_handler,
    set_custom_signal_handler,
)
from texts.install_command import InstallCmdTexts

if TYPE_CHECKING:
    from unittest.mock import Mock


@pytest.fixture(autouse=True)
def mock_configure_logging(mocker):
    mocker.patch("commands.install.configure_logging")


@pytest.fixture(autouse=True)
def mock_product_build(mocker):
    mock_get_target_product_build = mocker.patch("commands.install.get_target_product_build")
    mock_get_target_product_build.return_value = "X.Y.Z"


@pytest.fixture
def mock_install_dependencies(mocker):
    mocker.patch("commands.install.run_initial_checks")
    mocker.patch("commands.install.run_installation_checks")
    mocker.patch("commands.install.create_logs_dir")
    mocker.patch("commands.install.execute_installation")
    mocker.patch("commands.install.prompt_for_installation_config")
    mocker.patch("commands.install.display_final_confirmation")


def test_install_interactive(mocker):
    run_initial_checks_mock: Mock = mocker.patch("commands.install.run_initial_checks")
    run_installation_checks_mock: Mock = mocker.patch("commands.install.run_installation_checks")
    create_logs_dir_mock: Mock = mocker.patch("commands.install.create_logs_dir")
    execute_installation_mock: Mock = mocker.patch("commands.install.execute_installation")
    prompt_for_installation_config_mock: Mock = mocker.patch("commands.install.prompt_for_installation_config")
    display_final_confirmation_mock: Mock = mocker.patch("commands.install.display_final_confirmation")

    runner = CliRunner()
    result = runner.invoke(install)

    run_initial_checks_mock.assert_called_once()
    create_logs_dir_mock.assert_called_once_with()
    run_installation_checks_mock.assert_called_once()
    assert prompt_for_installation_config_mock.call_count == 1
    assert execute_installation_mock.call_count == 1
    assert display_final_confirmation_mock.call_count == 1
    assert not result.exception


@pytest.mark.parametrize("valid_data_folder_path", ["/tmp", "  /tmp  "])
def test_install_config_file(mocker, tmpdir, valid_data_folder_path: str):
    run_initial_checks_mock: Mock = mocker.patch("commands.install.run_initial_checks")
    run_installation_checks_mock: Mock = mocker.patch("commands.install.run_installation_checks")
    create_logs_dir_mock: Mock = mocker.patch("commands.install.create_logs_dir")
    execute_installation_mock: Mock = mocker.patch("commands.install.execute_installation")
    mocker.patch("os.path.isfile", return_value=False)
    mocker.patch("os.listdir", return_value=[])
    get_path_permissions_mock: Mock = mocker.patch("validators.path.get_path_permissions", return_value="750")

    config_file_content = {
        "user_login": "admin@test.com",
        "user_password": "12345%Qwerty",
        "data_folder": valid_data_folder_path,
        "accept_third_party_licenses": True,
    }

    yaml_file_path = tmpdir.join("config.yaml")
    with open(yaml_file_path, mode="w") as config_file:
        yaml.safe_dump(config_file_content, config_file)

    runner = CliRunner()
    result = runner.invoke(install, ["--config-file", yaml_file_path])

    print(f"\n{result.stdout}")
    assert not result.exception
    assert execute_installation_mock.call_count == 1
    run_installation_checks_mock.assert_called_once()
    run_initial_checks_mock.assert_called_once()
    create_logs_dir_mock.assert_called_once_with()
    get_path_permissions_mock.assert_called_once()


def test_initial_check_failure(mocker):
    run_initial_checks_mock: Mock = mocker.patch(
        "commands.install.run_initial_checks", side_effect=CumulativeCheckError
    )

    runner = CliRunner()
    result = runner.invoke(install)

    assert result.exception
    run_initial_checks_mock.assert_called_once()


def test_install_check_failure(mocker):
    run_initial_checks_mock: Mock = mocker.patch("commands.install.run_initial_checks")
    run_installation_checks_mock: Mock = mocker.patch(
        "commands.install.run_installation_checks", side_effect=CumulativeCheckError
    )
    create_logs_dir_mock: Mock = mocker.patch("commands.install.create_logs_dir")
    execute_installation_mock: Mock = mocker.patch("commands.install.execute_installation")
    prompt_for_installation_config_mock: Mock = mocker.patch("commands.install.prompt_for_installation_config")
    prompt_for_configuration_value_mock: Mock = mocker.patch("commands.install.prompt_for_configuration_value")

    runner = CliRunner()
    result = runner.invoke(install)

    assert prompt_for_configuration_value_mock.call_count == 0
    assert prompt_for_installation_config_mock.call_count == 0
    assert execute_installation_mock.call_count == 0
    assert result.exception
    run_initial_checks_mock.assert_called_once()
    run_installation_checks_mock.assert_called_once()
    create_logs_dir_mock.assert_called_once_with()


def test_install_execution_failure(mocker):
    run_initial_checks_mock: Mock = mocker.patch("commands.install.run_initial_checks")
    run_installation_checks_mock: Mock = mocker.patch("commands.install.run_installation_checks")
    execute_installation_mock: Mock = mocker.patch("commands.install.execute_installation", side_effect=RuntimeError)
    prompt_for_installation_config_mock: Mock = mocker.patch("commands.install.prompt_for_installation_config")
    display_final_confirmation_mock: Mock = mocker.patch("commands.install.display_final_confirmation")
    create_logs_dir_mock: Mock = mocker.patch("commands.install.create_logs_dir")

    runner = CliRunner()
    result = runner.invoke(install)

    assert prompt_for_installation_config_mock.call_count == 1
    assert execute_installation_mock.call_count == 1
    assert display_final_confirmation_mock.call_count == 1
    assert result.exception
    run_initial_checks_mock.assert_called_once()
    run_installation_checks_mock.assert_called_once()
    create_logs_dir_mock.assert_called_once_with()


@pytest.fixture
def mock_interrupt_handler_dependencies(mocker):
    return (
        mocker.patch("commands.install.click.secho"),
        mocker.patch("commands.install.uninstall_k3s"),
        mocker.patch("sys.exit"),
    )


def test_handler_abort(mock_interrupt_handler_dependencies):
    mock_click, mock_uninstall_k3s, mock_exit = mock_interrupt_handler_dependencies

    handler_state = {"can_be_aborted": True, "already_triggered": False}
    data_folder = "/path/to/data"

    handler = custom_interrupt_handler_with_args(handler_state, data_folder)

    handler(signal.SIGINT, None)

    mock_click.assert_any_call("\n" + InstallCmdTexts.installation_aborted, fg="yellow")
    mock_uninstall_k3s.assert_called_with(delete_data=True, data_folder=data_folder)
    mock_click.assert_any_call("\n" + InstallCmdTexts.installation_aborted_succeeded, fg="green")
    mock_exit.assert_called_once_with(0)


def test_handler_no_abort(mock_interrupt_handler_dependencies):
    mock_click, mock_uninstall_k3s, mock_exit = mock_interrupt_handler_dependencies

    handler_state = {"can_be_aborted": False, "already_triggered": False}
    data_folder = "/path/to/data"

    handler = custom_interrupt_handler_with_args(handler_state, data_folder)

    handler(signal.SIGINT, None)

    mock_click.assert_any_call("\n" + InstallCmdTexts.k3s_installation_in_progress, fg="yellow")
    mock_uninstall_k3s.assert_not_called()
    mock_exit.assert_not_called()


def test_handler_already_triggered(mock_interrupt_handler_dependencies):
    mock_click, mock_uninstall_k3s, mock_exit = mock_interrupt_handler_dependencies

    handler_state = {"can_be_aborted": True, "already_triggered": True}
    data_folder = "/path/to/data"

    handler = custom_interrupt_handler_with_args(handler_state, data_folder)

    handler(signal.SIGINT, None)

    mock_click.assert_not_called()
    mock_uninstall_k3s.assert_not_called()
    mock_exit.assert_not_called()


def test_set_and_reset_signal_handler(mock_interrupt_handler_dependencies):
    mock_click, mock_uninstall_k3s, mock_exit = mock_interrupt_handler_dependencies

    handler_state = {"can_be_aborted": False, "already_triggered": False}
    data_folder = "/path/to/data"

    set_custom_signal_handler(handler_state, data_folder)
    current_handler = signal.getsignal(signal.SIGINT)

    if callable(current_handler):
        current_handler(signal.SIGINT, None)

    mock_click.assert_any_call("\n" + InstallCmdTexts.k3s_installation_in_progress, fg="yellow")
    mock_uninstall_k3s.assert_not_called()

    reset_custom_signal_handler(handler_state)

    if callable(current_handler):
        current_handler(signal.SIGINT, None)

    mock_uninstall_k3s.assert_called_with(delete_data=True, data_folder=data_folder)
    mock_exit.assert_called_once_with(0)
    mock_click.assert_any_call("\n" + InstallCmdTexts.installation_aborted, fg="yellow")
    mock_click.assert_any_call("\n" + InstallCmdTexts.installation_aborted_succeeded, fg="green")
