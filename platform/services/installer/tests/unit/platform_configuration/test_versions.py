# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from platform_configuration.versions import get_target_platform_version, get_target_product_build


def test_get_target_platform_version(mocker):
    platform_version_mock = {"product_version": "1.2.0"}
    open_file_mock = mocker.patch("platform_configuration.versions.open")
    yaml_safe_load_mock = mocker.patch(
        "platform_configuration.versions.yaml.safe_load", return_value=platform_version_mock
    )

    result = get_target_platform_version()
    assert open_file_mock.call_count == 1
    assert yaml_safe_load_mock.call_count == 1
    assert result == platform_version_mock["product_version"]


def test_get_target_product_build(mocker):
    product_build_mock = {"product_build": "1.2.0-rc1-20220630112805"}
    open_file_mock = mocker.patch("platform_configuration.versions.open")
    yaml_safe_load_mock = mocker.patch(
        "platform_configuration.versions.yaml.safe_load", return_value=product_build_mock
    )

    result = get_target_product_build()
    assert open_file_mock.call_count == 1
    assert yaml_safe_load_mock.call_count == 1
    assert result == product_build_mock["product_build"]
