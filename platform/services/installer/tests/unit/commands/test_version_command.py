# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE


from typing import TYPE_CHECKING

from click.testing import CliRunner

from commands.version import version

if TYPE_CHECKING:
    from unittest.mock import Mock


def test_version(mocker):
    platform_version_mock = "1.2.0"
    product_build_mock = "1.2.0-rc1-20220630112805"
    get_target_platform_version_mock: Mock = mocker.patch(
        "commands.version.get_target_platform_version", return_value=platform_version_mock
    )
    get_target_product_build_mock: Mock = mocker.patch(
        "commands.version.get_target_product_build", return_value=product_build_mock
    )

    runner = CliRunner()
    result = runner.invoke(version)

    assert result.output == f"Product version: {platform_version_mock}\nBuild version: {product_build_mock}\n"
    assert get_target_platform_version_mock.call_count == 1
    assert get_target_product_build_mock.call_count == 1
    assert not result.exception
