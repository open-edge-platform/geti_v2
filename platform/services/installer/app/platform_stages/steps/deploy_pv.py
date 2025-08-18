# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import os

from configuration_models.install_config import InstallationConfig
from configuration_models.upgrade_config import UpgradeConfig
from constants.charts import PV_CHART
from constants.paths import PLATFORM_INSTALL_PATH
from platform_configuration.versions import get_target_product_build
from platform_stages.steps.errors import ChartInstallationError, ChartPullError, PVInstallationError
from platform_utils.helm import pull_chart, upsert_chart


def deploy_pv_chart(config: InstallationConfig | UpgradeConfig, charts_dir: str = PLATFORM_INSTALL_PATH) -> None:
    """
    Method used to deploy pv and pvc to mount directory defined by 'data_folder'
    """
    try:
        chart_version = get_target_product_build() if config.lightweight_installer.value else None
        chart_dir = str(os.path.join(charts_dir, PV_CHART.directory))
        if chart_version:
            pull_chart(chart_version, chart_dir)
        upsert_chart(
            name=PV_CHART.name,
            version=chart_version,
            chart_dir=chart_dir,
            sets=f"dataStoragePath={config.data_folder.value}",
            namespace=PV_CHART.namespace,
        )
    except (ChartInstallationError, ChartPullError) as ex:
        raise PVInstallationError from ex
