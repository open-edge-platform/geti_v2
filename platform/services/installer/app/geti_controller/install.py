# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import base64
import logging
import os
from http import HTTPStatus

import jinja2
import yaml
from kubernetes import client

from configuration_models.install_config import InstallationConfig
from configuration_models.upgrade_config import UpgradeConfig
from constants.paths import GETI_CONTROLLER_CHART_PATH, K3S_KUBECONFIG_PATH
from constants.platform import PLATFORM_NAMESPACE
from geti_controller.constants import GETI_CONTROLLER_CHART_NAME, GETI_CONTROLLER_NAMESPACE
from geti_controller.errors import GetiControllerInstallationError
from platform_configuration.versions import get_target_platform_version, get_target_product_build
from platform_utils.k8s import KubernetesConfigHandler

logger = logging.getLogger(__name__)


def encode_data_b64(data: bytes) -> str:  # noqa: D103
    return base64.b64encode(data).decode("utf-8")


def apply_manifest(manifest: dict, namespace: str = GETI_CONTROLLER_NAMESPACE) -> None:
    """
    Apply a HelmChart manifest to the Kubernetes cluster.
    If the resource exists, it will be patched.
    """
    logger.debug(f"Applying Geti Controller HelmChart manifest to namespace: {namespace}")
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    with client.ApiClient() as api_client:
        custom_api = client.CustomObjectsApi(api_client)
        try:
            custom_api.create_namespaced_custom_object(
                group="helm.cattle.io",
                version="v1",
                namespace=namespace,
                plural="helmcharts",
                body=manifest,
            )
            logger.debug(f"Created HelmChart CR: {manifest['metadata']['name']}")
        except client.exceptions.ApiException as create_err:
            if create_err.status == HTTPStatus.CONFLICT:
                logger.warning("HelmChart already exists, patching the existing CR.")
                try:
                    custom_api.patch_namespaced_custom_object(
                        group="helm.cattle.io",
                        version="v1",
                        namespace=namespace,
                        plural="helmcharts",
                        name=manifest["metadata"]["name"],
                        body=manifest,
                    )
                    logger.info(f"Patched HelmChart CR: {manifest['metadata']['name']}")
                except client.exceptions.ApiException as patch_err:
                    logger.exception(f"Failed to patch HelmChart CR: {patch_err}")
                    raise
            else:
                logger.exception(f"Failed to create HelmChart CR {manifest['metadata']['name']}: {create_err}")
                raise


def deploy_geti_controller_chart(
    config: InstallationConfig | UpgradeConfig, template_path: str = GETI_CONTROLLER_CHART_PATH
) -> None:
    """
    Render the Jinja2 template and deploy using helm controller.
    """
    try:
        http_proxy = os.getenv("http_proxy") or os.getenv("HTTP_PROXY")
        https_proxy = os.getenv("https_proxy") or os.getenv("HTTPS_PROXY")
        no_proxy = os.getenv("no_proxy") or os.getenv("NO_PROXY") or ""
        no_proxy += f",127.0.0.1,localhost,.{PLATFORM_NAMESPACE},.svc,.cluster.local"

        context = {
            "chart_name": GETI_CONTROLLER_CHART_NAME,
            "username": config.username.value,
            "password_hash": config.password_sha.value,
            "data_folder": config.data_folder.value,
            "geti_registry": config.geti_image_registry.value,
            "image_registry": config.image_registry.value,
            "platform_version": get_target_platform_version(),
            "build_version": get_target_product_build(),
            "tls_cert_file": "",
            "tls_key_file": "",
            "repoCA": "",
            "proxy_enabled": bool(http_proxy or https_proxy),
            "https_proxy": https_proxy or "",
            "http_proxy": http_proxy or "",
            "no_proxy": no_proxy,
        }
        if config.tls_cert_file and config.tls_key_file and config.tls_cert_file.value and config.tls_key_file.value:
            with open(config.tls_cert_file.value, "rb") as cert_file:
                cert_content = cert_file.read()
                context["tls_cert_file"] = encode_data_b64(cert_content)
            with open(config.tls_key_file.value, "rb") as key_file:
                key_content = key_file.read()
                context["tls_key_file"] = encode_data_b64(key_content)
        elif config.tls_cert_content.value and config.tls_key_content.value:
            context["tls_cert_file"] = encode_data_b64(config.tls_cert_content.value.encode("utf-8"))
            context["tls_key_file"] = encode_data_b64(config.tls_key_content.value.encode("utf-8"))

        if config.repoCA.value:
            with open(config.repoCA.value, "rb") as ca_file:
                ca_content = ca_file.read()
                context["repoCA"] = encode_data_b64(ca_content)

        with open(template_path) as f:
            template_content = f.read()
        template = jinja2.Template(template_content)
        rendered_str = template.render(context)
        manifest = yaml.safe_load(rendered_str)
        apply_manifest(manifest, namespace=GETI_CONTROLLER_NAMESPACE)
        logger.info("Geti Controller HelmChart deployed successfully.")

    except Exception as ex:
        logger.exception("Failed to deploy Geti Controller HelmChart.")
        raise GetiControllerInstallationError from ex
