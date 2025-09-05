# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from pathlib import Path
from unittest.mock import Mock, patch

import pytest
import yaml

from configuration_models.base_config_model import BaseConfig, ConfigurationField, ValidationError


class DummyConfig(BaseConfig):
    def __init__(self) -> None:
        self.string_field = ConfigurationField(type=str)
        self.int_field = ConfigurationField(type=int)
        self.bool_field = ConfigurationField(type=bool)
        self._private_value = "bla"


def test_get_configuration_fields():
    string_configuration_field = ConfigurationField(type=str)
    int_configuration_field = ConfigurationField(type=int)
    bool_configuration_field = ConfigurationField(type=bool)

    class TestConfig(BaseConfig):
        def __init__(self) -> None:
            self.string_field = string_configuration_field
            self.int_field = int_configuration_field
            self.bool_field = bool_configuration_field
            self._private_value = "bla"

    assert sorted(TestConfig().get_configuration_fields()) == sorted(
        [
            ("string_field", string_configuration_field),
            ("int_field", int_configuration_field),
            ("bool_field", bool_configuration_field),
        ]
    )


def test_are_all_required_fields_set_error():
    test_config = DummyConfig()
    test_config.string_field.value = "bla"
    test_config.bool_field.value = False
    test_config.int_field.value = None

    with pytest.raises(ValidationError):
        test_config.are_all_required_fields_set()


def test_are_all_required_fields_set():
    test_config = DummyConfig()
    test_config.string_field.value = "bla"
    test_config.bool_field.value = False
    test_config.int_field.value = 4

    test_config.are_all_required_fields_set()


def test_are_all_fields_valid():
    test_config = DummyConfig()
    test_config.string_field.value = "bla"
    test_config.string_field.validation_callback = Mock()
    test_config.bool_field.value = False
    test_config.int_field.value = 4
    test_config.int_field.validation_callback = Mock()

    test_config.are_all_fields_valid()

    assert test_config.string_field.validation_callback.call_count == 1
    assert test_config.int_field.validation_callback.call_count == 1


def test_are_all_fields_valid_error():
    test_config = DummyConfig()
    test_config.string_field.value = "bla"
    test_config.string_field.validation_callback = Mock(side_effect=ValidationError("Dummy err"))
    test_config.bool_field.value = False
    test_config.int_field.value = 4

    with pytest.raises(ValidationError):
        test_config.are_all_fields_valid()


def test_convert_to_config_dict():
    test_config = DummyConfig()
    test_config.string_field.value = "bla"
    test_config.bool_field.value = False
    test_config.int_field.value = 4

    assert test_config.convert_to_config_dict() == {
        "int_field": test_config.int_field.value,
        "bool_field": test_config.bool_field.value,
        "string_field": test_config.string_field.value,
    }


def test_load_from_yaml(tmpdir):
    config_file_content = {"int_field": 4, "string_field": "bla", "bool_field": False}

    yaml_file_path = tmpdir.join("config.yaml")
    with open(yaml_file_path, mode="w") as config_file:
        yaml.safe_dump(config_file_content, config_file)

    test_config = DummyConfig()
    test_config.load_config_from_yaml(yaml_file_path)

    assert test_config.convert_to_config_dict() == {
        "int_field": config_file_content["int_field"],
        "bool_field": config_file_content["bool_field"],
        "string_field": config_file_content["string_field"],
    }


@pytest.mark.parametrize(
    "yaml_content,err_msg_expected",
    (
        pytest.param("", DummyConfig._ERR_MSG_INVALID_YAML, id="empty"),
        pytest.param("foo", DummyConfig._ERR_MSG_INVALID_YAML, id="str"),
        pytest.param("- 1\n- 2", DummyConfig._ERR_MSG_INVALID_YAML, id="list"),
        pytest.param("key:val\nfoo: bar", DummyConfig._ERR_MSG_INVALID_YAML, id="missing-space-after-colon"),
    ),
)
def test_load_config_from_yaml_invalid_doc(tmp_path: Path, yaml_content: str, err_msg_expected: str):
    """Tests the load_from_yaml function against input files that are not valid YAML documents."""
    path_yaml = tmp_path / "input.yaml"
    path_yaml.write_text(yaml_content)

    with pytest.raises(ValidationError) as err_info:
        DummyConfig().load_config_from_yaml(str(path_yaml.resolve()), False)

    assert str(err_info.value) == err_msg_expected


def test_validate():
    test_config = DummyConfig()
    with (
        patch.object(test_config, "are_all_required_fields_set", return_value=[]),
        patch.object(test_config, "are_all_fields_valid", return_value=[]),
    ):
        assert test_config.validate() is None


def test_validate_error():
    test_config = DummyConfig()
    error_list = ["Dummy field validation error message"]
    with (
        patch.object(test_config, "are_all_required_fields_set", return_value=[]),
        patch.object(
            test_config, "are_all_fields_valid", return_value=[], side_effect=ValidationError(error_messages=error_list)
        ),
    ):
        with pytest.raises(ValidationError):
            test_config.validate()
