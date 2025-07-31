# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import logging
from http import HTTPStatus

from kubernetes import client

from constants.paths import K3S_KUBECONFIG_PATH
from geti_controller.constants import GETI_CONTROLLER_CHART_NAME, GETI_CONTROLLER_NAMESPACE
from geti_controller.errors import GetiControllerUninstallationError
from platform_utils.k8s import KubernetesConfigHandler

logger = logging.getLogger(__name__)


def uninstall_geti_controller_chart() -> None:
    """
    Method used to uninstall Geti Controller chart
    """
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    try:
        with client.ApiClient() as api_client:
            custom_api = client.CustomObjectsApi(api_client)
            custom_api.delete_namespaced_custom_object(
                group="helm.cattle.io",
                version="v1",
                namespace=GETI_CONTROLLER_NAMESPACE,
                plural="helmcharts",
                name=GETI_CONTROLLER_CHART_NAME,
            )
        logger.info("Geti Controller HelmChart CR deleted successfully.")
    except client.exceptions.ApiException as ex:
        if ex.status == HTTPStatus.NOT_FOUND:
            logger.warning("HelmChart CR not found, nothing to delete.")
        else:
            logger.exception("Failed to delete Geti Controller HelmChart CR.")
            raise GetiControllerUninstallationError from ex
