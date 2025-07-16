# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
This command is only used for Geti installations without Geti controller.
"""

import base64
import gzip
import json
import logging
import os
import re
import signal
import sys
import time
from typing import TYPE_CHECKING

import rich_click as click
from kubernetes import client as kube_client
from kubernetes.client import ApiException
from kubernetes.client.models import V1Secret

from checks.errors import CumulativeCheckError
from cli_utils.credentials import hash_ldap_password
from cli_utils.platform_logs import configure_logging, create_logs_dir, subprocess_run
from configuration_models.migrate_config import MigrationConfig
from constants.paths import INSTALL_LOG_FILE_PATH, K3S_KUBECONFIG_PATH
from constants.platform import (
    CERT_MANAGER_NAMESPACE,
    CUSTOM_TLS_SECRET_NAME,
    DATA_STORAGE_VOLUME_NAME,
    FLYTE_NAMESPACE,
    GETI_LABEL_KEY,
    GETI_LABEL_VALUE,
    ISTIO_NAMESPACE,
    JOBS_PRODUCTION_NAMESPACE,
    LDAP_SECRET_NAME,
    MONGODB_SECRET_NAME,
    OPA_NAMESPACE,
    PLATFORM_NAMESPACE,
    POSTGRESQL_SECRET_NAME,
    SEAWEEDFS_SECRET_NAME,
    SPICEDB_SECRET_NAME,
    KUBE_SYSTEM_NAMESPACE,
    KUBELET_CSR_APPROVER_NAME,
)
from geti_controller.communication import (
    OperationStatus,
    call_install_endpoint,
    get_installation_status,
)
from geti_controller.errors import GetiControllerError
from geti_controller.install import deploy_geti_controller_chart
from platform_configuration.versions import get_current_platform_version
from platform_utils.errors import (
    CredentialsError,
    DownloadSystemPackagesError,
    HelmReleaseError,
    MigrateError,
    PlatformCleanUpError,
    PlatformVersionError,
    PVInfoError,
    SecretsPreparationError,
    TLSCertificateEmptyError,
    TLSCertificateInfoError,
)
from platform_utils.install_system_packages import install_system_packages
from platform_utils.k8s import decode_string_b64
from platform_utils.kube_config_handler import KubernetesConfigHandler
from platform_utils.management.state import InstallationHandlerState, cluster_info_dump
from texts.install_command import InstallCmdConfirmationTexts, InstallCmdTexts
from texts.migrate_command import MigrateCmdTexts

if TYPE_CHECKING:
    from collections.abc import Callable
from checks.migrate import is_migration_possible
from cli_utils.checks import run_checks
from texts.checks import MigrationChecksTexts

logger = logging.getLogger(__name__)


def custom_interrupt_handler_with_args(handler_state: InstallationHandlerState):  # noqa: ANN201
    """
    Handle installation interruption
    """

    def handler(sig, frame):  # noqa: ARG001, ANN001
        if not handler_state.trigger():
            return

        if handler_state.can_be_aborted:
            logger.warning("Installation of the platform was aborted.")
            click.secho("\n" + InstallCmdTexts.installation_aborted, fg="yellow")
            sys.exit(0)
        else:
            logger.warning("k3s installation cannot be aborted")
            click.secho("\n" + InstallCmdTexts.k3s_installation_in_progress, fg="yellow")
            handler_state.clear_trigger()

    return handler


def set_custom_signal_handler(handler_state: InstallationHandlerState) -> None:
    """
    Set custom signal handler for installation.
    """
    handler = custom_interrupt_handler_with_args(handler_state)
    signal.signal(signal.SIGINT, handler)


def migration_checks() -> None:
    """
    Run initial checks, executed before install wizard prompts.
    """
    checks: list[tuple[str, Callable]] = [
        (MigrationChecksTexts.migration_check_start, is_migration_possible),
    ]

    run_checks(checks=checks)


def run_migration_checks() -> None:
    """
    Run migration_checks, print a message and terminate script execution on error.
    """
    try:
        migration_checks()
    except CumulativeCheckError:
        click.echo(MigrateCmdTexts.checks_error_message)
        sys.exit(1)


def _get_data_folder() -> str:
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    try:
        with kube_client.ApiClient() as client:
            core_api = kube_client.CoreV1Api(client)
            logger.debug("Get dataStoragePath...")
            pv = core_api.read_persistent_volume(name=DATA_STORAGE_VOLUME_NAME)
            return pv.spec.host_path.path
    except ApiException as e:
        logger.error(f"Failed to get Persistent Volume '{DATA_STORAGE_VOLUME_NAME}': {e}")
        raise PVInfoError(f"Failed to get Persistent Volume '{DATA_STORAGE_VOLUME_NAME}'.") from e


def _get_tls_certificates() -> tuple[str, str] | None:
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    try:
        with kube_client.ApiClient() as client:
            core_api = kube_client.CoreV1Api(client)
            logger.debug("Get tls.key and tls.crt...")
            custom_tls = core_api.read_namespaced_secret(name=CUSTOM_TLS_SECRET_NAME, namespace=ISTIO_NAMESPACE)
            if custom_tls.metadata.annotations and "cert-manager.io/issuer-group" in custom_tls.metadata.annotations:
                # if secret is managed by cert-manager then tls certificates will be autogenerated
                return None
            if "tls.crt" in custom_tls.data and "tls.key" in custom_tls.data:
                tls_cert_file = decode_string_b64(custom_tls.data["tls.crt"])
                tls_key_file = decode_string_b64(custom_tls.data["tls.key"])
                return tls_cert_file, tls_key_file
            raise TLSCertificateEmptyError("Custom TLS secret does not contain required keys 'tls.crt' and 'tls.key'.")
    except ApiException as e:
        logger.error(f"Failed to get Custom TLS secret '{CUSTOM_TLS_SECRET_NAME}': {e}")
        raise TLSCertificateInfoError(f"Failed to get Custom TLS secret '{CUSTOM_TLS_SECRET_NAME}'.") from e


def _get_newest_helm_release_secret(namespace: str) -> V1Secret | None:
    """
    Get all secrets with names matching the pattern 'sh.helm.release.v1.control-plane.vX'
    where X is a version number.
    """
    # Load Kubernetes configuration
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    try:
        # Initialize the CoreV1Api
        with kube_client.ApiClient() as client:
            core_api = kube_client.CoreV1Api(client)
        # List all secrets in the specified namespace
        secrets = core_api.list_namespaced_secret(namespace=namespace)
        # Define the regex pattern for matching secret names
        pattern = re.compile(r"^sh\.helm\.release\.v1\.control-plane\.v(\d+)$")
        # Extract secrets with version numbers
        versioned_secrets = []
        for secret in secrets.items:
            match = pattern.match(secret.metadata.name)
            if match:
                version = int(match.group(1))
                versioned_secrets.append((version, secret))
        # Find the secret with the highest version
        if versioned_secrets:
            _, newest_secret = max(versioned_secrets, key=lambda x: x[0])
            return newest_secret
        return None
    except ApiException as e:
        logger.error(f"Failed to list secrets in namespace '{namespace}': {e}")
        raise HelmReleaseError(f"Failed to list secrets in namespace '{namespace}'.") from e


def _get_credentials() -> tuple[str, str]:
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    try:
        with kube_client.ApiClient() as client:
            core_api = kube_client.CoreV1Api(client)
            latest_impt_secret: V1Secret = _get_newest_helm_release_secret(namespace=PLATFORM_NAMESPACE)
            logger.debug(f"Latest impt helm release: {latest_impt_secret.metadata.name}")
            secret = core_api.read_namespaced_secret(
                name=latest_impt_secret.metadata.name, namespace=PLATFORM_NAMESPACE
            )
            encoded_release = secret.data.get("release")

            # Decode the base64 data twice
            decoded_once = base64.b64decode(encoded_release)

            decoded_twice = base64.b64decode(decoded_once)

            # Decompress the gzip data
            decompressed_data = gzip.decompress(decoded_twice)
            release_data = json.loads(decompressed_data)
            global_section = release_data["config"]["global"]
            password = global_section.get("initial_admin_user_password")
            username = global_section.get("initial_admin_user_login")
            logger.info(f"Username: {username}, Password: {password}")
            return username, password
    except ApiException as e:
        logger.error(f"Failed to get credentials from Helm release secret: {e}")
        raise CredentialsError("Failed to get credentials from Helm release secret.") from e


# def _get_gpu_configuration() -> tuple[str, str]:
#     KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
#     with kube_client.ApiClient() as client:
#         core_api = kube_client.CoreV1Api(client)
#         accelerator_config_cm = core_api.read_namespaced_config_map(
#         "accelerator-configuration", namespace=PLATFORM_NAMESPACE
#         )
#         accelerator_name = accelerator_config_cm.data.get("accelerator_name")
#         accelerator_type = accelerator_config_cm.data.get("accelerator_type")
#         return accelerator_type, accelerator_name


def gather_data_for_migration(config: MigrationConfig) -> None:
    """
    - get data-folder from pv and compare it with impt-configuration cm
    - get tls-cert and tls-key from secret custom-tls and check for cert-manager annotations.
        If not present, take tls.key and tls.crt.
    - get username and password from initial-user job (will have different names depending on the geti version).
    - get gpu config from accelerator-config cm.
    reuse those values and start installation.
    """
    click.echo(MigrateCmdTexts.gather_message)
    try:
        config.data_folder.value = _get_data_folder()
        tls_certificates = _get_tls_certificates()
        if tls_certificates is not None:
            config.tls_cert_content.value, config.tls_key_content.value = tls_certificates
        else:
            config.tls_cert_content.value = ""
            config.tls_key_content.value = ""
        username, password = _get_credentials()
        config.username.value = username
        config.password.value = password
        config.password_sha.value = hash_ldap_password(password)
    except MigrateError as e:
        logger.error(f"Failed to gather info for migration: {e}")
        sys.exit(1)


def display_final_confirmation(config: MigrationConfig) -> None:
    """
    Display the gathered data and asks for the confirmation.
    """
    click.echo()
    click.echo(InstallCmdConfirmationTexts.confirm_username_message.format(username=config.username.value))
    click.secho(InstallCmdTexts.selected_password, nl=False)
    click.secho(config.password.value, fg="yellow")
    click.echo()

    if config.custom_certificate:
        click.echo(InstallCmdConfirmationTexts.cert_file_message.format(path=config.tls_cert_file.value))
        click.echo(InstallCmdConfirmationTexts.key_file_message.format(path=config.tls_key_file.value))
    elif config.tls_key_content.value and config.tls_cert_content.value:
        click.echo(InstallCmdConfirmationTexts.custom_certificate_k3s_message)
    else:
        click.echo(InstallCmdConfirmationTexts.no_custom_certificate_message)

    click.echo()
    click.echo(InstallCmdConfirmationTexts.confirm_data_message.format(path=config.data_folder.value))


def prepare_geti_for_migration(config: MigrationConfig) -> None:
    """
    Prepare the Geti platform for migration.
    Delete everything except for secrets with credentials and custom-tls secret.
    Store secrets as a backup in the data folder.
    """
    click.echo(MigrateCmdTexts.prepare_message)
    try:
        current_platform_version: str = get_current_platform_version(kubeconfig_path=K3S_KUBECONFIG_PATH)
    except ApiException as e:
        logger.error(f"Failed to get current platform version: {e}")
        raise PlatformVersionError("Failed to get current platform version.") from e
    backup_location = os.path.join(config.data_folder.value, f"backup_data_{current_platform_version}")
    config.backup_location.value = backup_location

    with open(INSTALL_LOG_FILE_PATH, "a", encoding="utf-8") as log_file:
        # Remove the existing backup directory if it exists and create a new one
        subprocess_run(["rm", "-rf", backup_location], log_file)
        os.makedirs(backup_location, exist_ok=True)

    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    with kube_client.ApiClient() as client:
        core_api = kube_client.CoreV1Api(client)
        logger.debug("Backing up secrets...")
        try:
            for secret_name in [
                MONGODB_SECRET_NAME,
                POSTGRESQL_SECRET_NAME,
                SPICEDB_SECRET_NAME,
                LDAP_SECRET_NAME,
                SEAWEEDFS_SECRET_NAME,
            ]:
                secret_data = core_api.read_namespaced_secret(name=secret_name, namespace=PLATFORM_NAMESPACE)
                with open(f"{config.backup_location.value}/{secret_name}.json", "w") as secret_file:
                    secret_file.write(str(secret_data))
                logger.debug("Labeling secrets...")
                # Add or update the label
                if not secret_data.metadata.labels:
                    secret_data.metadata.labels = {}
                secret_data.metadata.labels.update({GETI_LABEL_KEY: GETI_LABEL_VALUE})
                if not secret_data.metadata.annotations:
                    secret_data.metadata.annotations = {}
                secret_data.metadata.annotations.update({"meta.helm.sh/release-name": "geti-tools"})
                core_api.patch_namespaced_secret(name=secret_name, namespace=PLATFORM_NAMESPACE, body=secret_data)
        except ApiException as e:
            logger.error(f"Failed to prepared secrets: {e}")
            raise SecretsPreparationError("Failed to prepare secrets.") from e
        try:
            logger.debug("Cleaning up platform...")
            for ns in [
                ISTIO_NAMESPACE,
                OPA_NAMESPACE,
                CERT_MANAGER_NAMESPACE,
                FLYTE_NAMESPACE,
                JOBS_PRODUCTION_NAMESPACE,
            ]:
                logger.debug(f"Deleting namespace: {ns}")
                core_api.delete_namespace(name=ns)
        except ApiException as e:
            if e.status == 404:
                logger.info("Namespace already deleted.")
            else:
                logger.error(f"Failed to clean up platform: {e}")
                raise PlatformCleanUpError("Failed to clean up platform.") from e
    cleanup_main_ns()
    cleanup_kubelet_csr_approver()


def cleanup_kubelet_csr_approver() -> None:
    """
    Cleanup the kubelet csr approver from system.
    """
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    logger.info("Deleting kubelet csr approver...")
    with kube_client.ApiClient() as client:
        try:
            app_api = kube_client.AppsV1Api(client)
            app_api.delete_namespaced_deployment(name=KUBELET_CSR_APPROVER_NAME, namespace=KUBE_SYSTEM_NAMESPACE)
            rbac_api = kube_client.RbacAuthorizationV1Api(client)
            rbac_api.delete_cluster_role(name=KUBELET_CSR_APPROVER_NAME)
            rbac_api.delete_cluster_role_binding(name=KUBELET_CSR_APPROVER_NAME)
            core_api = kube_client.CoreV1Api(client)
            core_api.delete_namespaced_service_account(name=KUBELET_CSR_APPROVER_NAME, namespace=KUBE_SYSTEM_NAMESPACE)
            secrets = core_api.list_namespaced_secret(namespace=KUBE_SYSTEM_NAMESPACE)
            for item in secrets.items:
                if KUBELET_CSR_APPROVER_NAME in item.metadata.name:
                    core_api.delete_namespaced_secret(name=item.metadata.name, namespace=KUBE_SYSTEM_NAMESPACE)
        except ApiException as e:
            logger.error(f"Failed to delete: {e}")
    logger.info("Kubelet csr approver deleted successfully.")




def cleanup_main_ns() -> None:  # noqa: PLR0912, PLR0915, C901
    """
    Cleanup the main namespace by removing all resources except for selected secrets.
    """
    logger.info("Cleaning up main namespace...")
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    with kube_client.ApiClient() as client:
        app_api = kube_client.AppsV1Api(client)
        exclude_label_selector = f"!{GETI_LABEL_KEY}"
        deployments = app_api.list_namespaced_deployment(
            namespace=PLATFORM_NAMESPACE, label_selector=exclude_label_selector
        )
        for item in deployments.items:
            try:
                app_api.delete_namespaced_deployment(name=item.metadata.name, namespace=PLATFORM_NAMESPACE)
                logger.debug(f"Deleted deployment: {item.metadata.name}")
            except ApiException as e:
                logger.error(f"Failed to delete deployment {item.metadata.name}: {e}")
        daemonsets = app_api.list_namespaced_daemon_set(
            namespace=PLATFORM_NAMESPACE, label_selector=exclude_label_selector
        )
        for item in daemonsets.items:
            try:
                app_api.delete_namespaced_daemon_set(name=item.metadata.name, namespace=PLATFORM_NAMESPACE)
                logger.debug(f"Deleted daemon set: {item.metadata.name}")
            except ApiException as e:
                logger.error(f"Failed to delete daemon set {item.metadata.name}: {e}")
        statefulsets = app_api.list_namespaced_stateful_set(
            namespace=PLATFORM_NAMESPACE, label_selector=exclude_label_selector
        )
        for item in statefulsets.items:
            try:
                app_api.delete_namespaced_stateful_set(name=item.metadata.name, namespace=PLATFORM_NAMESPACE)
                logger.debug(f"Deleted statefulset: {item.metadata.name}")
            except ApiException as e:
                logger.error(f"Failed to delete statefulset {item.metadata.name}: {e}")
        batch_api = kube_client.BatchV1Api(client)
        cronjobs = batch_api.list_namespaced_cron_job(
            namespace=PLATFORM_NAMESPACE, label_selector=exclude_label_selector
        )
        for item in cronjobs.items:
            try:
                batch_api.delete_namespaced_cron_job(name=item.metadata.name, namespace=PLATFORM_NAMESPACE)
                logger.debug(f"Deleted cron job: {item.metadata.name}")
            except ApiException as e:
                logger.error(f"Failed to delete cron job {item.metadata.name}: {e}")
        jobs = batch_api.list_namespaced_job(namespace=PLATFORM_NAMESPACE, label_selector=exclude_label_selector)
        for item in jobs.items:
            try:
                batch_api.delete_namespaced_job(name=item.metadata.name, namespace=PLATFORM_NAMESPACE)
                logger.debug(f"Deleted job: {item.metadata.name}")
            except ApiException as e:
                logger.error(f"Failed to delete job {item.metadata.name}: {e}")
        core_api = kube_client.CoreV1Api(client)
        services = core_api.list_namespaced_service(namespace=PLATFORM_NAMESPACE, label_selector=exclude_label_selector)
        for item in services.items:
            try:
                core_api.delete_namespaced_service(name=item.metadata.name, namespace=PLATFORM_NAMESPACE)
                logger.debug(f"Deleted service: {item.metadata.name}")
            except ApiException as e:
                logger.error(f"Failed to delete service {item.metadata.name}: {e}")
        secrets = core_api.list_namespaced_secret(namespace=PLATFORM_NAMESPACE, label_selector=exclude_label_selector)
        for item in secrets.items:
            try:
                core_api.delete_namespaced_secret(name=item.metadata.name, namespace=PLATFORM_NAMESPACE)
                logger.debug(f"Deleted secrets: {item.metadata.name}")
            except ApiException as e:
                logger.error(f"Failed to delete secrets {item.metadata.name}: {e}")
        configmaps = core_api.list_namespaced_config_map(
            namespace=PLATFORM_NAMESPACE, label_selector=exclude_label_selector
        )
        for item in configmaps.items:
            try:
                core_api.delete_namespaced_config_map(name=item.metadata.name, namespace=PLATFORM_NAMESPACE)
                logger.debug(f"Deleted configmap: {item.metadata.name}")
            except ApiException as e:
                logger.error(f"Failed to delete configmap {item.metadata.name}: {e}")
        pods = core_api.list_namespaced_pod(namespace=PLATFORM_NAMESPACE, label_selector=exclude_label_selector)
        for item in pods.items:
            try:
                core_api.delete_namespaced_pod(name=item.metadata.name, namespace=PLATFORM_NAMESPACE)
                logger.debug(f"Deleted pod: {item.metadata.name}")
            except ApiException as e:
                logger.error(f"Failed to delete pod {item.metadata.name}: {e}")
        rbac_api = kube_client.RbacAuthorizationV1Api(client)
        cluster_roles = rbac_api.list_cluster_role(label_selector=exclude_label_selector)
        for item in cluster_roles.items:
            if any(name in item.metadata.name for name in [
                "dex", "cert-manager", "istio", "kserve", "impt", "flyte", "modelmesh", "reloader", "platform-cleaner"
            ]):
                try:
                    rbac_api.delete_cluster_role(name=item.metadata.name)
                    logger.debug(f"Deleted ClusterRole: {item.metadata.name}")
                except ApiException as e:
                    logger.error(f"Failed to delete ClusterRole {item.metadata.name}: {e}")
        cluster_role_bindings = rbac_api.list_cluster_role_binding(label_selector=exclude_label_selector)
        for item in cluster_role_bindings.items:
            if any(name in item.metadata.name for name in [
                "dex", "cert-manager", "istio", "kserve", "impt", "flyte", "modelmesh", "reloader", "platform-cleaner"
            ]):
                try:
                    rbac_api.delete_cluster_role_binding(name=item.metadata.name)
                    logger.debug(f"Deleted ClusterRoleBinding: {item.metadata.name}")
                except ApiException as e:
                    logger.error(f"Failed to delete ClusterRoleBinding {item.metadata.name}: {e}")
        role_bindings = rbac_api.list_namespaced_role_binding(
            namespace=PLATFORM_NAMESPACE, label_selector=exclude_label_selector
        )
        for item in role_bindings.items:
            try:
                rbac_api.delete_namespaced_role_binding(name=item.metadata.name, namespace=PLATFORM_NAMESPACE)
                logger.debug(f"Deleted RoleBinding: {item.metadata.name}")
            except ApiException as e:
                logger.error(f"Failed to delete RoleBinding {item.metadata.name}: {e}")
        roles = rbac_api.list_namespaced_role(namespace=PLATFORM_NAMESPACE, label_selector=exclude_label_selector)
        for item in roles.items:
            try:
                rbac_api.delete_namespaced_role(name=item.metadata.name, namespace=PLATFORM_NAMESPACE)
                logger.debug(f"Deleted Role: {item.metadata.name}")
            except ApiException as e:
                logger.error(f"Failed to delete Role {item.metadata.name}: {e}")
        service_accounts = core_api.list_namespaced_service_account(
            namespace=PLATFORM_NAMESPACE, label_selector=exclude_label_selector
        )
        for item in service_accounts.items:
            if item.metadata.name == "default":
                # Do not delete default service account
                continue
            try:
                core_api.delete_namespaced_service_account(name=item.metadata.name, namespace=PLATFORM_NAMESPACE)
                logger.debug(f"Deleted ServiceAccount: {item.metadata.name}")
            except ApiException as e:
                logger.error(f"Failed to delete ServiceAccount {item.metadata.name}: {e}")

        autoscaling_api = kube_client.AutoscalingV1Api(client)
        hpas = autoscaling_api.list_namespaced_horizontal_pod_autoscaler(
            namespace=PLATFORM_NAMESPACE, label_selector=exclude_label_selector
        )
        for item in hpas.items:
            try:
                autoscaling_api.delete_namespaced_horizontal_pod_autoscaler(
                    name=item.metadata.name, namespace=PLATFORM_NAMESPACE
                )
                logger.debug(f"Deleted HPA: {item.metadata.name}")
            except ApiException as e:
                logger.error(f"Failed to delete HPA {item.metadata.name}: {e}")

        api_instance = kube_client.ApiextensionsV1Api(client)
        custom_resources = api_instance.list_custom_resource_definition(
            label_selector=exclude_label_selector,
        )
        for item in custom_resources.items:
            if any(group in item.spec.group for group in ["dex", "cert-manager", "istio", "kserve", "flyte"]):
                try:
                    api_instance.delete_custom_resource_definition(
                        name=item.metadata.name,
                    )
                    logger.debug(f"Deleted custom resource: {item.metadata.name}")
                except ApiException as e:
                    logger.error(f"Failed to delete custom resource {item['metadata']['name']}: {e}")
        logger.info("Main namespace cleaned.")
        logger.info("Updating main namespace annotations...")
        main_ns = core_api.read_namespace(name=PLATFORM_NAMESPACE)
        if not main_ns.metadata.labels:
            main_ns.metadata.labels = {}
        main_ns.metadata.labels.update({"app.kubernetes.io/managed-by": "Helm"})
        if not main_ns.metadata.annotations:
            main_ns.metadata.annotations = {}
        main_ns.metadata.annotations.update({"meta.helm.sh/release-name": "geti-namespaces"})
        core_api.patch_namespace(name=PLATFORM_NAMESPACE, body=main_ns)
        logger.info("Main namespace annotations updated.")


def monitor_installation_progress() -> tuple[str, str]:
    """
    Monitor the installation progress and update the user with the current status.
    """
    total_progress = 100  # progress is reported as a percentage
    previous_progress = 0
    status, message = "", ""

    while True:
        installation_status = get_installation_status(kube_config=K3S_KUBECONFIG_PATH)

        if installation_status.status == OperationStatus.NOT_RUNNING:
            # waiting for installation to start
            time.sleep(1)
            continue

        if installation_status.status == OperationStatus.RUNNING:
            with click.progressbar(
                length=total_progress, label=InstallCmdTexts.installation_start, show_eta=False
            ) as progress_bar:
                while installation_status.status == OperationStatus.RUNNING:
                    installation_status = get_installation_status(kube_config=K3S_KUBECONFIG_PATH)
                    progress_bar.update(installation_status.progress - previous_progress)
                    previous_progress = installation_status.progress
                    if installation_status.progress == total_progress:
                        break
                    time.sleep(1)

        status, message = installation_status.status, installation_status.message
        break

    return status, message


def execute_migration(config: MigrationConfig) -> None:
    """
    Execute the migration process.
    """
    click.echo(MigrateCmdTexts.execution_start_message)
    handler_state = InstallationHandlerState()
    set_custom_signal_handler(handler_state)

    try:
        click.echo(InstallCmdTexts.sys_pkgs_installing)
        install_system_packages(config)
        click.secho(InstallCmdTexts.sys_pkgs_installation_succeeded, fg="green")
    except DownloadSystemPackagesError:
        logger.exception("Error during system packages installation.")
        click.secho(InstallCmdTexts.sys_pkgs_installation_failed, fg="red")
        sys.exit(1)

    handler_state.reset()

    try:
        deploy_geti_controller_chart(config=config)
        controller_response = call_install_endpoint(kube_config=K3S_KUBECONFIG_PATH)
        logger.info(f"Response from the GetiController installation endpoint: {controller_response}")
        status, message = monitor_installation_progress()
        if status != OperationStatus.SUCCEEDED:
            raise GetiControllerError(f"Installation failed with status: {status}, message: {message}")
    except GetiControllerError:
        logger.exception("Error during installation.")
        click.secho("\n" + InstallCmdTexts.installation_failed, fg="red")
        cluster_info_dump(kubeconfig=K3S_KUBECONFIG_PATH)
        sys.exit(1)
    finally:
        # uninstall_geti_controller_chart()
        pass


@click.command()
def migrate() -> None:
    """
    Migrate Geti from "old" version without Geti controller.
    """
    click.echo(MigrateCmdTexts.start_message)
    create_logs_dir()
    configure_logging()
    config = MigrationConfig()
    run_migration_checks()
    gather_data_for_migration(config=config)

    display_final_confirmation(config=config)
    prepare_geti_for_migration(config=config)
    execute_migration(config=config)
