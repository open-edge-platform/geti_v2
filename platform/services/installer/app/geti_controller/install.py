# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import logging
import os

import yaml

from configuration_models.install_config import InstallationConfig
from configuration_models.upgrade_config import UpgradeConfig
from constants.charts import GETI_CONTROLLER_CHART
from constants.paths import GETI_CONTROLLER_CHART_PATH
from constants.platform import PLATFORM_NAMESPACE
from geti_controller.errors import GetiControllerInstallationError
from platform_configuration.versions import get_target_product_build
from platform_utils.errors import ChartInstallationError
from platform_utils.helm import upsert_chart
from platform_utils.k8s import encode_data_b64

logger = logging.getLogger(__name__)


def deploy_geti_controller_chart(
    config: InstallationConfig | UpgradeConfig, charts_dir: str = GETI_CONTROLLER_CHART_PATH
) -> None:
    """
    Method used to deploy Geti Controller chart
    """

    try:
        chart_version = get_target_product_build()
        http_proxy = os.getenv("http_proxy") or os.getenv("HTTP_PROXY")
        https_proxy = os.getenv("https_proxy") or os.getenv("HTTPS_PROXY")
        no_proxy = os.getenv("no_proxy") or os.getenv("NO_PROXY") or ""
        no_proxy += f",127.0.0.1,localhost,.{PLATFORM_NAMESPACE},.svc,.cluster.local"

        configuration_data = {
            "global": {
                "ingress_enabled": False,
                "registry_address": f"{config.geti_image_registry.value}/open-edge-platform",
                "login": config.username.value,
                "passwordHash": config.password_sha.value,
                "dataFolder": config.data_folder.value,
                "tlsCert": "",
                "tlsKey": "",
                "proxy": {
                    "enabled": bool(http_proxy or https_proxy),
                    "http_proxy": http_proxy if http_proxy is not None else "",
                    "https_proxy": https_proxy if https_proxy is not None else "",
                    "no_proxy": no_proxy if no_proxy is not None else "",
                },
                "imageRegistry": config.image_registry.value,
                "platformVersion": get_target_product_build(),
            },
        }

        if config.tls_cert_file and config.tls_key_file and config.tls_cert_file.value and config.tls_key_file.value:
            with open(config.tls_cert_file.value, "rb") as cert_file:
                cert_content = cert_file.read()
                configuration_data["global"]["tlsCert"] = encode_data_b64(cert_content)
            with open(config.tls_key_file.value, "rb") as key_file:
                key_content = key_file.read()
                configuration_data["global"]["tlsKey"] = encode_data_b64(key_content)
        elif config.tls_cert_content.value and config.tls_key_content.value:
            configuration_data["global"]["tlsCert"] = encode_data_b64(config.tls_cert_content.value.encode("utf-8"))
            configuration_data["global"]["tlsKey"] = encode_data_b64(config.tls_key_content.value.encode("utf-8"))

        if config.repoCA.value:
            with open(config.repoCA.value, "rb") as ca_file:
                ca_content = ca_file.read()
                configuration_data["global"]["repoCA"] = encode_data_b64(ca_content)

        values_file_path = os.path.join(charts_dir, "controller_values.yaml")
        with open(values_file_path, "w") as values_file:
            yaml.safe_dump(configuration_data, values_file)

        upsert_chart(
            name=GETI_CONTROLLER_CHART.name,
            version=chart_version,
            chart_dir=charts_dir,
            namespace=GETI_CONTROLLER_CHART.namespace,
            values=[values_file_path],
        )
    except ChartInstallationError as ex:
        raise GetiControllerInstallationError from ex
