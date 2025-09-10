# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from unittest.mock import Mock

from cli_utils.prompts import prompt_for_configuration_value
from configuration_models.base_config_model import ConfigurationField
from validators.errors import ValidationError


def test_prompt_for_configuration_value(mocker):
    input_value = "test"
    click_prompt_mock: Mock = mocker.patch("cli_utils.prompts.click.prompt")
    click_prompt_mock.return_value = input_value

    validation_callback_mock = Mock()
    config_field = ConfigurationField(type=str, validation_callback=validation_callback_mock)

    prompt_for_configuration_value(config_field, "Test prompt")

    assert click_prompt_mock.call_count == 1
    validation_callback_mock.assert_called_once_with(input_value)
    assert config_field.value == input_value


def test_prompt_for_configuration_value_bool(mocker):
    input_value = "Y"
    click_confirm_mock: Mock = mocker.patch("cli_utils.prompts.click.confirm")
    click_confirm_mock.return_value = input_value

    validation_callback_mock = Mock()
    config_field = ConfigurationField(type=bool, validation_callback=validation_callback_mock)

    prompt_for_configuration_value(config_field, "Test prompt")

    assert click_confirm_mock.call_count == 1
    validation_callback_mock.assert_called_once_with(input_value)
    assert config_field.value == input_value


def test_prompt_for_configuration_value_wrong_value(mocker):
    input_value = "test"
    click_prompt_mock: Mock = mocker.patch("cli_utils.prompts.click.prompt")
    click_prompt_mock.return_value = input_value

    validation_callback_mock = Mock(side_effect=[ValidationError, None])
    config_field = ConfigurationField(type=str, validation_callback=validation_callback_mock)

    prompt_for_configuration_value(config_field, "Test prompt")

    assert click_prompt_mock.call_count == 2
    validation_callback_mock.assert_called_with(input_value)
    assert validation_callback_mock.call_count == 2
