# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import logging
import os

from configuration_models.install_config import InstallationConfig
from configuration_models.upgrade_config import UpgradeConfig
from constants.charts import OPA_CHART
from constants.paths import PLATFORM_INSTALL_PATH
from platform_configuration.versions import get_target_product_build
from platform_stages.steps.errors import ChartInstallationError, ChartPullError, OPAInstallationError
from platform_utils.helm import pull_chart, save_jinja_template, upsert_chart

logger = logging.getLogger(__name__)
FULL_VALUES_FILE_NAME = str(os.path.join(PLATFORM_INSTALL_PATH, OPA_CHART.values_file))


def deploy_opa_chart(config: InstallationConfig | UpgradeConfig, charts_dir: str = PLATFORM_INSTALL_PATH) -> None:
    """
    Install opa chart
    """
    data = {
        "registry": config.image_registry.value,
        "geti_registry": config.geti_image_registry.value,
        "product_build": get_target_product_build(),
    }

    save_jinja_template(OPA_CHART.values_template_file, data, FULL_VALUES_FILE_NAME)

    try:
        chart_version = get_target_product_build() if config.lightweight_installer.value else None
        chart_dir = str(os.path.join(charts_dir, OPA_CHART.directory))
        if chart_version:
            pull_chart(chart_version, chart_dir)
        upsert_chart(
            name=OPA_CHART.name,
            version=chart_version,
            chart_dir=chart_dir,
            namespace=OPA_CHART.namespace,
            values=[FULL_VALUES_FILE_NAME],
            timeout="30m",
        )
    except (ChartInstallationError, ChartPullError) as ex:
        raise OPAInstallationError from ex
