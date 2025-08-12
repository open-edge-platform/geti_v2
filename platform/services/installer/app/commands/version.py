# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
CLI command for version operation.
"""

import rich_click as click

from platform_configuration.versions import get_target_platform_version, get_target_product_build


@click.command()
def version() -> None:
    """
    Display product and build version.
    """
    click.echo(f"Product version: {get_target_platform_version()}")
    click.echo(f"Build version: {get_target_product_build()}")
