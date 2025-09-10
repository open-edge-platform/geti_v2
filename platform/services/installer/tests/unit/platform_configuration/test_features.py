# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import os

import pytest

from platform_configuration.features import (
    FEATURE_FLAGS,
    FeatureFlag,
    get_updated_feature_flags,
    is_feature_flag_enabled,
)

PATCHING_TARGET = "platform_configuration.features"


@pytest.mark.parametrize(
    ["os_environ", "feature_flags", "equal"],
    [
        (
            {"FEATURE_FLAG_ENV_1": "true", "OTHER_ENV_1": "fakeEnvVariable"},
            {"FEATURE_FLAG_ENV_1": "false", "FEATURE_FLAG_ENV_2": "false"},
            False,
        ),
        (
            {"FEATURE_FLAG_ENV_1": "true", "FEATURE_FLAG_ENV_2": "true", "OTHER_ENV_1": "fakeEnvVariable"},
            {"FEATURE_FLAG_ENV_1": "false", "FEATURE_FLAG_ENV_2": "false"},
            False,
        ),
        (
            {"FAKE_FEATURE_FLAG_ENV_1": "true", "FEATURE_ENV_2": "true", "OTHER_ENV": "fakeEnvVariable"},
            {"FEATURE_FLAG_ENV_1": "false", "FEATURE_FLAG_ENV_2": "false"},
            True,
        ),
    ],
)
def test_get_updated_feature_flags(mocker, os_environ, feature_flags, equal):
    mocker.patch.dict(os.environ, os_environ)
    mocker.patch.dict(FEATURE_FLAGS, feature_flags, clear=True)

    updated_feature_flags = get_updated_feature_flags()

    assert len(feature_flags) == len(updated_feature_flags) and (updated_feature_flags == feature_flags) == equal


@pytest.mark.parametrize(
    "os_environ,expected_value",
    (
        pytest.param({"FEATURE_FLAG_AMBIENT_MESH": "true", "OTHER_ENV_1": "fakeEnvVariable"}, True, id="positive"),
        pytest.param({"FEATURE_FLAG_AMBIENT_MESH": "wrong", "OTHER_ENV_1": "fakeEnvVariable"}, False, id="negative"),
        pytest.param({"OTHER_ENV_1": "fakeEnvVariable"}, False, id="negative"),
    ),
)
def test_is_feature_flag_enabled(mocker, os_environ, expected_value):
    feature_flag = FeatureFlag.AMBIENT_MESH

    get_updated_feature_flags = mocker.patch("platform_configuration.features.get_updated_feature_flags")
    get_updated_feature_flags.return_value = os_environ

    is_enabled = is_feature_flag_enabled(feature_flag=feature_flag)

    assert is_enabled == expected_value


@pytest.mark.parametrize(
    "existing_tools_directory, tools_directory_content, expected_result",
    [
        (True, ["mock_value"], True),
        (False, [], False),
        (True, [], False),
    ],
)
def test_is_offline_installation_enabled(
    mocker, existing_tools_directory, tools_directory_content, expected_result
) -> None:
    mocker.patch(f"{PATCHING_TARGET}.os.path.isdir", return_value=existing_tools_directory)
    mocker.patch(f"{PATCHING_TARGET}.os.listdir", return_value=tools_directory_content)
    result = is_feature_flag_enabled(FeatureFlag.OFFLINE_INSTALLATION)
    assert result == expected_result
