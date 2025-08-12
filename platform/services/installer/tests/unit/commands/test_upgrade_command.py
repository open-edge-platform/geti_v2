# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import signal
from unittest.mock import Mock

import pytest
import yaml
from click.testing import CliRunner

from checks.errors import CheckError, CumulativeCheckError
from commands.upgrade import (
    apply_config_overrides,
    custom_interrupt_handler_with_args,
    reset_custom_signal_handler,
    set_custom_signal_handler,
    upgrade,
)
from configuration_models.upgrade_config import UpgradeConfig
from platform_configuration.errors import ConfigurationError
from texts.upgrade_command import UpgradeCmdTexts


@pytest.fixture(autouse=True)
def mock_configure_logging(mocker):
    mocker.patch("commands.upgrade.configure_logging")


@pytest.fixture(autouse=True)
def mock_product_build(mocker):
    mock_get_target_product_build = mocker.patch("commands.upgrade.get_target_product_build")
    mock_get_target_product_build.return_value = "X.Y.Z"


def test_upgrade_interactive(mocker):
    run_checks_mock: Mock = mocker.patch("commands.upgrade.run_checks")
    execute_upgrade_mock: Mock = mocker.patch("commands.upgrade.execute_upgrade")
    prompt_for_upgrade_config_mock: Mock = mocker.patch("commands.upgrade.prompt_for_upgrade_config")
    display_final_confirmation_mock: Mock = mocker.patch("commands.upgrade.display_final_confirmation")
    create_logs_dir_mock: Mock = mocker.patch("commands.upgrade.create_logs_dir")
    is_kubernetes_running_on_k3s: Mock = mocker.patch("commands.upgrade.is_kubernetes_running_on_k3s")
    is_kubernetes_running_on_k3s.return_value = True

    runner = CliRunner()
    result = runner.invoke(upgrade)

    assert prompt_for_upgrade_config_mock.call_count == 1
    assert run_checks_mock.call_count == 2
    assert execute_upgrade_mock.call_count == 1
    assert display_final_confirmation_mock.call_count == 1
    assert not result.exception
    create_logs_dir_mock.assert_called_once_with()


@pytest.mark.parametrize(
    "is_grafana_installed", (pytest.param(True, id="Grafana_installed"), pytest.param(False, id="Grafana_absent"))
)
def test_upgrade_config_file(mocker, tmpdir, is_grafana_installed):
    run_initial_checks_mock: Mock = mocker.patch("commands.upgrade.run_initial_checks")
    run_upgrade_checks_mock: Mock = mocker.patch("commands.upgrade.run_upgrade_checks")
    execute_upgrade_mock: Mock = mocker.patch("commands.upgrade.execute_upgrade")
    is_grafana_installed_mock: Mock = mocker.patch(
        "commands.upgrade.is_grafana_installed", side_effect=[is_grafana_installed]
    )
    mocker.patch("configuration_models.upgrade_config.is_path_valid", return_value=None)
    create_logs_dir_mock: Mock = mocker.patch("commands.upgrade.create_logs_dir")
    is_kubernetes_running_on_k3s: Mock = mocker.patch("commands.upgrade.is_kubernetes_running_on_k3s")
    is_kubernetes_running_on_k3s.return_value = True

    kubeconfig_path = tmpdir.join("kubeconfig")
    kubeconfig_path.write("foo")
    config_file_content = {
        "kube_config": str(kubeconfig_path),
    }

    yaml_file_path = tmpdir.join("config.yaml")
    with open(yaml_file_path, mode="w") as config_file:
        yaml.safe_dump(config_file_content, config_file)

    runner = CliRunner()
    result = runner.invoke(upgrade, ["--config-file", yaml_file_path])

    run_initial_checks_mock.assert_called_once()
    run_upgrade_checks_mock.assert_called_once()
    is_grafana_installed_mock.assert_called_once_with(str(kubeconfig_path))
    create_logs_dir_mock.assert_called_once_with()
    assert execute_upgrade_mock.call_count == 1
    assert not result.exception


def test_initial_check_failure(mocker):
    run_initial_checks_mock: Mock = mocker.patch(
        "commands.upgrade.run_initial_checks", side_effect=CumulativeCheckError
    )

    runner = CliRunner()
    result = runner.invoke(upgrade)

    assert result.exception
    run_initial_checks_mock.assert_called_once()


def test_upgrade_check_failure(mocker):
    run_initial_checks_mock: Mock = mocker.patch("commands.upgrade.run_initial_checks")
    run_upgrade_checks_mock: Mock = mocker.patch("commands.upgrade.run_upgrade_checks", side_effect=CheckError)
    create_logs_dir_mock: Mock = mocker.patch("commands.upgrade.create_logs_dir")
    execute_upgrade_mock: Mock = mocker.patch("commands.upgrade.execute_upgrade")
    prompt_for_upgrade_config_mock: Mock = mocker.patch("commands.upgrade.prompt_for_upgrade_config")
    is_grafana_installed_mock: Mock = mocker.patch("commands.upgrade.is_grafana_installed")
    is_kubernetes_running_on_k3s: Mock = mocker.patch("commands.upgrade.is_kubernetes_running_on_k3s")
    is_kubernetes_running_on_k3s.return_value = True

    runner = CliRunner()
    result = runner.invoke(upgrade)

    run_initial_checks_mock.assert_called_once()
    run_upgrade_checks_mock.assert_called_once()
    create_logs_dir_mock.assert_called_once_with()
    prompt_for_upgrade_config_mock.assert_called_once()
    assert execute_upgrade_mock.call_count == 0
    assert is_grafana_installed_mock.call_count == 0
    assert result.exception


def test_upgrade_execution_failure(mocker):
    run_initial_checks_mock: Mock = mocker.patch("commands.upgrade.run_initial_checks")
    run_upgrade_checks_mock: Mock = mocker.patch("commands.upgrade.run_upgrade_checks")
    execute_upgrade_mock: Mock = mocker.patch("commands.upgrade.execute_upgrade", side_effect=RuntimeError)
    prompt_for_upgrade_config_mock: Mock = mocker.patch("commands.upgrade.prompt_for_upgrade_config")
    display_final_confirmation_mock: Mock = mocker.patch("commands.upgrade.display_final_confirmation")
    create_logs_dir_mock: Mock = mocker.patch("commands.upgrade.create_logs_dir")
    is_kubernetes_running_on_k3s: Mock = mocker.patch("commands.upgrade.is_kubernetes_running_on_k3s")
    is_kubernetes_running_on_k3s.return_value = True

    runner = CliRunner()
    result = runner.invoke(upgrade)

    run_initial_checks_mock.assert_called_once()
    run_upgrade_checks_mock.assert_called_once()
    create_logs_dir_mock.assert_called_once_with()
    assert prompt_for_upgrade_config_mock.call_count == 1
    assert execute_upgrade_mock.call_count == 1
    assert display_final_confirmation_mock.call_count == 1
    assert result.exception


@pytest.mark.parametrize(
    "is_grafana_installed", (pytest.param(True, id="Grafana_installed"), pytest.param(False, id="Grafana_absent"))
)
def test_apply_config_overrides(mocker, is_grafana_installed: bool):
    """Tests the apply_config_overrides function."""
    is_grafana_installed_mock: Mock = mocker.patch(
        "commands.upgrade.is_grafana_installed", side_effect=[is_grafana_installed]
    )
    kube_config_mock = "/path/to/kube_config"
    config = UpgradeConfig(interactive_mode=False, install_telemetry_stack=False)
    config.kube_config.value = kube_config_mock

    assert config.grafana_enabled.value is False

    apply_config_overrides(config)

    assert config.grafana_enabled.value is is_grafana_installed
    is_grafana_installed_mock.assert_called_once_with(kube_config_mock)


def test_apply_config_overrides_negative(mocker):
    """Tests the apply_config_overrides function."""
    mocker.patch("commands.upgrade.is_grafana_installed", side_effect=ConfigurationError)

    with pytest.raises(SystemExit):
        apply_config_overrides(Mock())


@pytest.fixture
def mock_dependencies(mocker):
    return (
        mocker.patch("commands.upgrade.click.secho"),
        mocker.patch("commands.upgrade.rollback_platform"),
        mocker.patch("sys.exit"),
    )


def test_handler_abort(mock_dependencies):
    mock_click, mock_rollback_platform, mock_exit = mock_dependencies

    handler_state = {"can_be_aborted": True, "already_triggered": False}

    config = UpgradeConfig(interactive_mode=False, install_telemetry_stack=False)
    location = data_folder = "/path/to/data"

    handler = custom_interrupt_handler_with_args(handler_state, config, location, data_folder)

    handler(signal.SIGINT, None)

    mock_click.assert_any_call("\n" + UpgradeCmdTexts.upgrade_aborted, fg="yellow")
    assert mock_rollback_platform.call_count == 1
    mock_click.assert_any_call("\n" + UpgradeCmdTexts.revert_succeeded, fg="green")
    mock_exit.assert_called_once_with(0)


def test_handler_no_abort(mock_dependencies):
    mock_click, mock_rollback_platform, mock_exit = mock_dependencies

    handler_state = {"can_be_aborted": False, "already_triggered": False}

    config = UpgradeConfig(interactive_mode=False, install_telemetry_stack=False)
    location = data_folder = "/path/to/data"

    handler = custom_interrupt_handler_with_args(handler_state, config, location, data_folder)

    handler(signal.SIGINT, None)

    mock_click.assert_any_call("\n" + UpgradeCmdTexts.k3s_upgrade_in_progress, fg="yellow")
    mock_rollback_platform.assert_not_called()
    mock_exit.assert_not_called()


def test_handler_already_triggered(mock_dependencies):
    mock_click, mock_rollback_platform, mock_exit = mock_dependencies

    handler_state = {"can_be_aborted": True, "already_triggered": True}

    config = UpgradeConfig(interactive_mode=False, install_telemetry_stack=False)
    location = data_folder = "/path/to/data"

    handler = custom_interrupt_handler_with_args(handler_state, config, location, data_folder)

    handler(signal.SIGINT, None)

    mock_click.assert_not_called()
    mock_rollback_platform.assert_not_called()
    mock_exit.assert_not_called()


def test_set_and_reset_signal_handler(mock_dependencies):
    mock_click, mock_rollback_platform, mock_exit = mock_dependencies

    handler_state = {"can_be_aborted": False, "already_triggered": False}

    config = UpgradeConfig(interactive_mode=False, install_telemetry_stack=False)
    location = config.data_folder.value = "/path/to/data"
    config.current_platform_version.value = "X.Y.Z"

    set_custom_signal_handler(handler_state, config, location, config.data_folder.value)
    current_handler = signal.getsignal(signal.SIGINT)

    if callable(current_handler):
        current_handler(signal.SIGINT, None)

    mock_click.assert_any_call("\n" + UpgradeCmdTexts.k3s_upgrade_in_progress, fg="yellow")
    mock_rollback_platform.assert_not_called()

    reset_custom_signal_handler(handler_state)

    if callable(current_handler):
        current_handler(signal.SIGINT, None)

    assert mock_rollback_platform.call_count == 1
    mock_exit.assert_called_once_with(0)
    mock_click.assert_any_call("\n" + UpgradeCmdTexts.upgrade_aborted, fg="yellow")
    mock_click.assert_any_call("\n" + UpgradeCmdTexts.revert_succeeded, fg="green")


@pytest.mark.parametrize("is_backed_up", (True, False))
def test_handler_is_backed_up(is_backed_up, mocker):
    mocker.patch("sys.exit")
    mocker.patch("commands.upgrade.os.path.exists", return_value=is_backed_up)
    mock_kill_all_k3s = mocker.patch("commands.upgrade.kill_all_k3s")
    mock_restore_data_folder = mocker.patch("commands.upgrade.restore_data_folder")
    mock_restore_k3s_state = mocker.patch("commands.upgrade.restore_k3s_state")
    mock_restart_k3s = mocker.patch("commands.upgrade.restart_k3s")

    handler_state = {"can_be_aborted": True, "already_triggered": False}

    config = UpgradeConfig(interactive_mode=False, install_telemetry_stack=False)
    location = data_folder = "/path/to/data"

    handler = custom_interrupt_handler_with_args(handler_state, config, location, data_folder)

    handler(signal.SIGINT, None)

    _call_count = 1 if is_backed_up else 0
    assert mock_kill_all_k3s.call_count == _call_count
    assert mock_restore_data_folder.call_count == _call_count
    assert mock_restore_k3s_state.call_count == _call_count

    _call_count ^= 1
    assert mock_restart_k3s.call_count == _call_count
