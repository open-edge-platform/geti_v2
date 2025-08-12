# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import os

from tenacity import retry_if_exception_type, stop_after_attempt, wait_fixed

from configuration_models.install_config import InstallationConfig
from configuration_models.upgrade_config import UpgradeConfig
from constants.charts import ISTIO_ISTIOD_CHART
from constants.paths import PLATFORM_INSTALL_PATH
from constants.platform import DEFAULT_HISTORY_MAX
from platform_configuration.features import FeatureFlag, is_feature_flag_enabled
from platform_configuration.versions import get_target_product_build
from platform_stages.steps.errors import ChartInstallationError, ChartPullError, IstioIstiodInstallationError
from platform_utils.helm import WAIT_FIXED, pull_chart, save_jinja_template, upsert_chart

FULL_VALUES_FILE_NAME = str(os.path.join(PLATFORM_INSTALL_PATH, ISTIO_ISTIOD_CHART.values_file))
ISTIOD_RETRY_ATTEMPTS = 5
ISTIOD_HISTORY_MAX = ISTIOD_RETRY_ATTEMPTS + DEFAULT_HISTORY_MAX


def deploy_istio_istiod_chart(
    config: InstallationConfig | UpgradeConfig, charts_dir: str = PLATFORM_INSTALL_PATH
) -> None:
    """
    Method used to deploy istiod chart
    """
    ambient_mesh = is_feature_flag_enabled(FeatureFlag.AMBIENT_MESH)
    data = {"registry": config.image_registry.value, "ff_ambient_mesh": ambient_mesh}
    save_jinja_template(
        source_file=ISTIO_ISTIOD_CHART.values_template_file, data=data, destination_file=FULL_VALUES_FILE_NAME
    )
    values_file = [FULL_VALUES_FILE_NAME]
    try:
        chart_version = get_target_product_build() if config.lightweight_installer.value else None
        chart_dir = str(os.path.join(charts_dir, ISTIO_ISTIOD_CHART.directory))
        if chart_version:
            pull_chart(chart_version, chart_dir)

        params = ""
        if ambient_mesh:
            params = "profile=ambient"

        upsert_chart.retry_with(
            retry=retry_if_exception_type(ChartInstallationError),
            stop=stop_after_attempt(ISTIOD_RETRY_ATTEMPTS),
            wait=wait_fixed(WAIT_FIXED),
            reraise=True,
        )(
            name=ISTIO_ISTIOD_CHART.name,
            version=chart_version,
            chart_dir=chart_dir,
            namespace=ISTIO_ISTIOD_CHART.namespace,
            values=values_file,
            sets=params,
            history_max=ISTIOD_HISTORY_MAX,
        )
    except (ChartInstallationError, ChartPullError) as ex:
        raise IstioIstiodInstallationError from ex
