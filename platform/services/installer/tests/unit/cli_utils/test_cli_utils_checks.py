# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from unittest.mock import MagicMock, Mock

import pytest

from cli_utils.checks import CheckError, CheckSkipped, CumulativeCheckError, run_checks


class CheckFunctionMock(MagicMock):
    __name__ = "check_function_mock"


def test_run_checks(mocker):
    click_echo_mock: Mock = mocker.patch("cli_utils.checks.click.echo")
    mocker.patch("cli_utils.checks.click_spinner")

    checks: list = [
        ("Check #1", CheckFunctionMock()),
        ("Check #2", CheckFunctionMock()),
        ("Check #3", CheckFunctionMock()),
    ]

    run_checks(checks=checks)

    for check_message, check_function in checks:
        click_echo_mock.assert_any_call(check_message, nl=False)
        assert check_function.call_count == 1


def test_run_checks_error(mocker):
    click_echo_mock: Mock = mocker.patch("cli_utils.checks.click.echo")
    mocker.patch("cli_utils.checks.click_spinner")

    checks: list = [
        ("Check #1", CheckFunctionMock()),
        ("Check #2", CheckFunctionMock(side_effect=[CheckError])),
        ("Check #3", CheckFunctionMock()),
    ]

    with pytest.raises(CumulativeCheckError):
        run_checks(checks=checks)

    for check_message, check_function in checks[:-1]:
        click_echo_mock.assert_any_call(check_message, nl=False)
        assert check_function.call_count == 1

    assert checks[-1][1].call_count == 1


def test_run_checks_skipped(mocker):
    click_echo_mock: Mock = mocker.patch("cli_utils.checks.click.echo")
    mocker.patch("cli_utils.checks.click_spinner")

    checks: list = [
        ("Check #1", CheckFunctionMock()),
        ("Check #2", CheckFunctionMock(side_effect=[CheckSkipped])),
        ("Check #3", CheckFunctionMock()),
    ]

    run_checks(checks=checks)

    for check_message, check_function in checks:
        click_echo_mock.assert_any_call(check_message, nl=False)
        assert check_function.call_count == 1
