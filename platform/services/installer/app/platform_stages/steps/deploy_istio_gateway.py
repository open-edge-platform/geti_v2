# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import os

import yaml
from tenacity import retry_if_exception_type, stop_after_attempt, wait_fixed

from configuration_models.install_config import InstallationConfig
from configuration_models.upgrade_config import UpgradeConfig
from constants.charts import ISTIO_GATEWAY_CHART
from constants.paths import PLATFORM_INSTALL_PATH
from constants.platform import DEFAULT_HISTORY_MAX
from platform_configuration.features import FeatureFlag, get_updated_feature_flags, is_feature_flag_enabled
from platform_configuration.versions import get_target_product_build
from platform_stages.steps.errors import ChartInstallationError, ChartPullError, IstioGatewayInstallationError
from platform_utils.helm import WAIT_FIXED, pull_chart, save_jinja_template, upsert_chart
from platform_utils.k8s import encode_data_b64

FULL_VALUES_FILE_NAME = str(os.path.join(PLATFORM_INSTALL_PATH, ISTIO_GATEWAY_CHART.values_file))
ISTIO_GATEWAY_RETRY_ATTEMPTS = 5
ISTIO_GATEWAY_HISTORY_MAX = ISTIO_GATEWAY_RETRY_ATTEMPTS + DEFAULT_HISTORY_MAX


def deploy_istio_gateway_chart(
    config: InstallationConfig | UpgradeConfig, charts_dir: str = PLATFORM_INSTALL_PATH
) -> None:
    """
    Method used to deploy istio gateway chart
    """
    data = {
        "registry": config.image_registry.value,
        "geti_registry": config.geti_image_registry.value,
        "product_build": get_target_product_build(),
        "feature_flags_data": yaml.safe_dump(
            get_updated_feature_flags({FeatureFlag.TELEMETRY_STACK: str(config.install_telemetry_stack.value).lower()})
        ),
        "ff_ambient_mesh": is_feature_flag_enabled(FeatureFlag.AMBIENT_MESH),
    }

    if (
        isinstance(config, InstallationConfig)
        and config.cert_file
        and config.key_file
        and config.cert_file.value
        and config.key_file.value
    ):
        with open(config.cert_file.value, "rb") as cert_file:
            cert_content = cert_file.read()
            data["cert_file"] = encode_data_b64(cert_content)

        with open(config.key_file.value, "rb") as key_file:
            key_content = key_file.read()
            data["key_file"] = encode_data_b64(key_content)

    save_jinja_template(
        source_file=ISTIO_GATEWAY_CHART.values_template_file, data=data, destination_file=FULL_VALUES_FILE_NAME
    )
    values_file = [FULL_VALUES_FILE_NAME]
    try:
        chart_version = get_target_product_build() if config.lightweight_installer.value else None
        chart_dir = str(os.path.join(charts_dir, ISTIO_GATEWAY_CHART.directory))
        if chart_version:
            pull_chart(chart_version, chart_dir)
        upsert_chart.retry_with(
            retry=retry_if_exception_type(ChartInstallationError),
            stop=stop_after_attempt(ISTIO_GATEWAY_RETRY_ATTEMPTS),
            wait=wait_fixed(WAIT_FIXED),
            reraise=True,
        )(
            name=ISTIO_GATEWAY_CHART.name,
            version=chart_version,
            chart_dir=chart_dir,
            namespace=ISTIO_GATEWAY_CHART.namespace,
            values=values_file,
            history_max=ISTIO_GATEWAY_HISTORY_MAX,
        )
    except (ChartInstallationError, ChartPullError) as ex:
        raise IstioGatewayInstallationError from ex
