# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from typing import TYPE_CHECKING

import pytest
import yaml
from click.testing import CliRunner
from kubernetes import client

from checks.errors import CheckError
from commands.uninstall import uninstall
from texts.uninstall_command import UninstallCmdTexts

if TYPE_CHECKING:
    from unittest.mock import Mock


@pytest.fixture(autouse=True)
def mock_configure_logging(mocker):
    mocker.patch("commands.uninstall.configure_logging")


def test_uninstall_interactive(mocker):
    run_checks_mock: Mock = mocker.patch("commands.uninstall.run_checks")
    execute_uninstallation_mock: Mock = mocker.patch("commands.uninstall.execute_uninstallation")
    prompt_for_uninstallation_config_mock: Mock = mocker.patch("commands.uninstall.prompt_for_uninstallation_config")
    display_final_confirmation_mock: Mock = mocker.patch("commands.uninstall.display_final_confirmation")
    create_logs_dir_mock: Mock = mocker.patch("commands.uninstall.create_logs_dir")

    runner = CliRunner()
    result = runner.invoke(uninstall)

    assert prompt_for_uninstallation_config_mock.call_count == 1
    assert run_checks_mock.call_count == 1
    assert execute_uninstallation_mock.call_count == 1
    assert display_final_confirmation_mock.call_count == 1
    assert not result.exception
    create_logs_dir_mock.assert_called_once_with()


def test_uninstall_config_file(mocker, tmpdir):
    run_initial_checks_mock: Mock = mocker.patch("commands.uninstall.run_initial_checks")
    run_uninstall_checks: Mock = mocker.patch("commands.uninstall.run_uninstall_checks")
    execute_uninstallation_mock: Mock = mocker.patch("commands.uninstall.execute_uninstallation")
    create_logs_dir_mock: Mock = mocker.patch("commands.uninstall.create_logs_dir")

    config_file_content = {
        "delete_data": "Yes",
    }

    yaml_file_path = tmpdir.join("config.yaml")
    with open(yaml_file_path, mode="w") as config_file:
        yaml.safe_dump(config_file_content, config_file)

    runner = CliRunner()
    result = runner.invoke(uninstall, ["--config-file", yaml_file_path])

    assert not result.exception
    assert execute_uninstallation_mock.call_count == 1
    create_logs_dir_mock.assert_called_once_with()
    run_initial_checks_mock.assert_called_once()
    run_uninstall_checks.assert_called_once()


def test_uninstall_check_failure(mocker):
    run_initial_checks_mock: Mock = mocker.patch("commands.uninstall.run_initial_checks")
    run_uninstall_checks_mock: Mock = mocker.patch("commands.uninstall.run_uninstall_checks", side_effect=CheckError)
    create_logs_dir_mock: Mock = mocker.patch("commands.uninstall.create_logs_dir")
    execute_uninstallation_mock: Mock = mocker.patch("commands.uninstall.execute_uninstallation")
    prompt_for_uninstallation_config_mock: Mock = mocker.patch("commands.uninstall.prompt_for_uninstallation_config")

    runner = CliRunner()
    result = runner.invoke(uninstall)

    run_initial_checks_mock.assert_called_once()
    run_uninstall_checks_mock.assert_not_called()
    create_logs_dir_mock.assert_called_once_with()
    assert prompt_for_uninstallation_config_mock.call_count == 1
    assert execute_uninstallation_mock.call_count == 0
    assert result.exception


def test_execute_uninstallation(mocker, tmpdir):
    run_initial_checks_mock: Mock = mocker.patch("commands.uninstall.run_initial_checks")
    run_uninstall_checks_mock: Mock = mocker.patch("commands.uninstall.run_uninstall_checks")
    get_data_folder_location_mock = mocker.patch(
        "k3s.uninstall._get_data_folder_location", side_effect=client.exceptions.ApiException
    )
    run_k3s_uninstaller_mock = mocker.patch("k3s.uninstall._run_k3s_uninstaller")
    create_logs_dir_mock: Mock = mocker.patch("commands.uninstall.create_logs_dir")

    runner = CliRunner()
    # prompts inputs confirming to delete k8s cluster, platform data and final confirmation
    result = runner.invoke(uninstall, input="\n".join(["Y", "Y", "Y"]))

    run_initial_checks_mock.assert_called_once()
    run_uninstall_checks_mock.assert_called_once()
    create_logs_dir_mock.assert_called_once_with()
    assert get_data_folder_location_mock.call_count == 1
    assert run_k3s_uninstaller_mock.call_count == 1
    assert UninstallCmdTexts.data_folder_get_failed in result.output
    assert UninstallCmdTexts.k3s_uninstallation_succeeded in result.output
    assert UninstallCmdTexts.data_folder_removal_failed in result.output


def test_uninstall_execution_failure(mocker):
    run_initial_checks_mock: Mock = mocker.patch("commands.uninstall.run_initial_checks")
    run_uninstall_checks_mock: Mock = mocker.patch("commands.uninstall.run_uninstall_checks")
    execute_uninstallation_mock: Mock = mocker.patch(
        "commands.uninstall.execute_uninstallation", side_effect=RuntimeError
    )
    prompt_for_uninstallation_config_mock: Mock = mocker.patch("commands.uninstall.prompt_for_uninstallation_config")
    display_final_confirmation_mock: Mock = mocker.patch("commands.uninstall.display_final_confirmation")
    create_logs_dir_mock: Mock = mocker.patch("commands.uninstall.create_logs_dir")

    runner = CliRunner()
    result = runner.invoke(uninstall)

    run_initial_checks_mock.assert_called_once()
    run_uninstall_checks_mock.assert_not_called()
    create_logs_dir_mock.assert_called_once_with()
    assert prompt_for_uninstallation_config_mock.call_count == 1
    assert execute_uninstallation_mock.call_count == 1
    assert display_final_confirmation_mock.call_count == 1
    assert result.exception
