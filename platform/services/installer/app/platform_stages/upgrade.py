# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from typing import TYPE_CHECKING

import rich_click as click

from texts.upgrade_command import UpgradeCmdTexts

if TYPE_CHECKING:
    from collections.abc import Callable

from functools import partial

from configuration_models.upgrade_config import UpgradeConfig
from platform_stages.steps.apply_minor_version_changes.apply_helm_metadata_to_crds import apply_helm_metadata_to_crds
from platform_stages.steps.apply_minor_version_changes.helm_keep_resource_policy import (
    add_helm_keep_resource_policy,
    remove_helm_keep_resource_policy,
)
from platform_stages.steps.apply_minor_version_changes.relabel import add_helm_label
from platform_stages.steps.apply_minor_version_changes.remove_previous_k8s_objects import remove_previous_k8s_objects
from platform_stages.steps.configure_gpu import configure_gpu
from platform_stages.steps.copy_platform_charts import copy_platform_charts
from platform_stages.steps.create_platform_dir import create_platform_dir
from platform_stages.steps.deploy_cert_manager import deploy_cert_manager_chart
from platform_stages.steps.deploy_cert_manager_istio_csr import deploy_cert_manager_istio_csr_chart
from platform_stages.steps.deploy_control_plane import deploy_control_plane_chart
from platform_stages.steps.deploy_crds import deploy_crds_chart
from platform_stages.steps.deploy_initial_manifests import deploy_initial_manifests
from platform_stages.steps.deploy_internal_registry import deploy_internal_registry
from platform_stages.steps.deploy_istio_base import deploy_istio_base_chart
from platform_stages.steps.deploy_istio_gateway import deploy_istio_gateway_chart
from platform_stages.steps.deploy_istio_istiod import deploy_istio_istiod_chart
from platform_stages.steps.deploy_kubelet_csr_approver import deploy_kubelet_csr_approver_chart
from platform_stages.steps.deploy_migration_job import deploy_migration_job
from platform_stages.steps.deploy_opa import deploy_opa_chart
from platform_stages.steps.deploy_platform import deploy_platform_chart
from platform_stages.steps.deploy_pv import deploy_pv_chart
from platform_stages.steps.deploy_reloader import deploy_reloader_chart
from platform_stages.steps.deploy_seaweed_fs import deploy_seaweed_fs_chart
from platform_stages.steps.extract_registry_data import extract_registry_data
from platform_stages.steps.load_images import load_images


def upgrade_platform(config: UpgradeConfig) -> None:
    """
    Upgrade platform
    """

    tasks: list[Callable] = [
        create_platform_dir,
        partial(copy_platform_charts, config=config),
        remove_previous_k8s_objects,
        apply_helm_metadata_to_crds,
        add_helm_label,
        partial(extract_registry_data, config=config),
        partial(load_images, config=config),
        partial(configure_gpu, config=config),
        deploy_initial_manifests,
        partial(deploy_reloader_chart, config=config),
        partial(deploy_kubelet_csr_approver_chart, config=config),
        partial(deploy_crds_chart, config=config),
        partial(deploy_pv_chart, config=config),
        partial(deploy_cert_manager_chart, config=config),
        partial(deploy_cert_manager_istio_csr_chart, config=config),
        partial(deploy_internal_registry, config=config),
        partial(deploy_istio_base_chart, config=config),
        partial(deploy_istio_istiod_chart, config=config),
        partial(add_helm_keep_resource_policy, config=config),
        partial(deploy_istio_gateway_chart, config=config),
        partial(deploy_opa_chart, config=config),
        partial(deploy_seaweed_fs_chart, config=config),
        partial(deploy_platform_chart, config=config),
        partial(deploy_control_plane_chart, config=config),
        partial(deploy_migration_job, config=config),
        partial(remove_helm_keep_resource_policy, config=config),
    ]

    with click.progressbar(tasks, label=UpgradeCmdTexts.upgrade_start, show_eta=False) as progress_bar:
        for task in progress_bar:
            task()
