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
import subprocess
import sys
from functools import partial
from typing import TYPE_CHECKING

import rich_click as click
from kubernetes import client as kube_client
from kubernetes.client import ApiException
from kubernetes.client.models import V1Secret

from checks.dns import check_dns_ipv4_handling
from checks.errors import CumulativeCheckError
from checks.internet import check_internet_connection
from checks.k8s import check_k8s_connection, check_k8s_gpu_requirements
from checks.os import check_os_version
from checks.resources import check_gpu_driver_version
from checks.user import check_user_id
from cli_utils.credentials import hash_ldap_password
from cli_utils.platform_logs import configure_logging, create_logs_dir, subprocess_run
from commands.install import run_geti_controller_installation
from configuration_models.upgrade_config import UpgradeConfig
from constants.paths import INSTALL_LOG_FILE_PATH, K3S_KUBECONFIG_PATH
from constants.platform import (
    CERT_MANAGER_NAMESPACE,
    CUSTOM_TLS_SECRET_NAME,
    DATA_STORAGE_VOLUME_CLAIM_NAME,
    DATA_STORAGE_VOLUME_NAME,
    DEFAULT_NAMESPACE,
    FLYTE_NAMESPACE,
    GETI_LABEL_KEY,
    GETI_LABEL_VALUE,
    ISTIO_NAMESPACE,
    JOBS_PRODUCTION_NAMESPACE,
    KUBE_SYSTEM_NAMESPACE,
    KUBELET_CSR_APPROVER_NAME,
    LDAP_SECRET_NAME,
    MONGODB_SECRET_NAME,
    NAMESPACE_CHART,
    OPA_NAMESPACE,
    PLATFORM_NAMESPACE,
    POSTGRESQL_SECRET_NAME,
    PV_CHART,
    REGCRED_SECRET_NAME,
    SEAWEEDFS_SECRET_NAME,
    SPICEDB_SECRET_NAME,
    STORAGE_CLASS,
    TOOLS_CHART,
)
from platform_configuration.versions import get_current_platform_version
from platform_utils.errors import (
    CredentialsError,
    DownloadSystemPackagesError,
    HelmReleaseError,
    KafkaPVRemovalError,
    NamespaceCleanUpError,
    PlatformVersionError,
    PVInfoError,
    ResourceDeletionError,
    ResourceListError,
    ResourcePatchError,
    SecretsPreparationError,
    TLSCertificateEmptyError,
    TLSCertificateInfoError,
    UpgradeError,
)
from platform_utils.install_system_packages import install_system_packages
from platform_utils.k8s import decode_string_b64
from platform_utils.kube_config_handler import KubernetesConfigHandler
from platform_utils.management.state import InstallationHandlerState
from texts.install_command import InstallCmdConfirmationTexts, InstallCmdTexts
from texts.upgrade_command import UpgradeCmdTexts
from validators.filepath import is_filepath_valid

if TYPE_CHECKING:
    from collections.abc import Callable
from checks.migrate import is_migration_possible
from cli_utils.checks import run_checks
from texts.checks import (
    DNSChecksTexts,
    InternetConnectionChecksTexts,
    K8SChecksTexts,
    LocalOSChecksTexts,
    LocalUserChecksTexts,
    MigrationChecksTexts,
    ResourcesChecksTexts,
)

logger = logging.getLogger(__name__)

EXCLUDE_LABEL_SELECTOR = f"!{GETI_LABEL_KEY}"


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


def initial_checks(config: UpgradeConfig) -> None:
    """
    Run initial checks, executed before upgrade wizard prompts.
    """
    checks: list[tuple[str, Callable]] = [
        (LocalUserChecksTexts.user_check_start, check_user_id),
        (LocalOSChecksTexts.os_check_start, partial(check_os_version, config=config)),
        (
            InternetConnectionChecksTexts.internet_connection_check_start,
            partial(check_internet_connection, config=config),
        ),
        (DNSChecksTexts.dns_ipv4_config_check, partial(check_dns_ipv4_handling, config=config)),
        (MigrationChecksTexts.migration_check_start, is_migration_possible),
        (
            K8SChecksTexts.connection_check_start,
            partial(check_k8s_connection, kubeconfig_path=K3S_KUBECONFIG_PATH),
        ),
        (
            K8SChecksTexts.gpu_requirements_check_start,
            partial(
                check_k8s_gpu_requirements,
                config=config,
            ),
        ),
        (
            ResourcesChecksTexts.gpu_driver_version_check_start,
            partial(
                check_gpu_driver_version,
                config=config,
            ),
        ),
    ]
    run_checks(checks=checks)


def run_initial_checks(config: UpgradeConfig) -> None:
    """
    Run migration_checks, print a message and terminate script execution on error.
    """
    try:
        initial_checks(config=config)
    except CumulativeCheckError:
        click.echo(UpgradeCmdTexts.checks_error_message)
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
            logger.debug(f"Latest control-plane helm release: {latest_impt_secret.metadata.name}")
            secret = core_api.read_namespaced_secret(
                name=latest_impt_secret.metadata.name, namespace=PLATFORM_NAMESPACE
            )
            encoded_release = secret.data.get("release")

            # Decode the base64 data twice
            decoded_once = base64.b64decode(encoded_release)
            decoded_twice = base64.b64decode(decoded_once)

            # Decompress the gzip data
            decompressed_data = gzip.decompress(decoded_twice)

            # Parse the JSON data
            release_data = json.loads(decompressed_data)
            global_section = release_data["config"]["global"]
            password = global_section.get("initial_admin_user_password")
            username = global_section.get("initial_admin_user_login")
            return username, password
    except ApiException as e:
        logger.error(f"Failed to get credentials from Helm release secret: {e}")
        raise CredentialsError("Failed to get credentials from Helm release secret.") from e


def gather_data_for_migration(config: UpgradeConfig) -> None:
    """
    - get data-folder from pv and compare it with impt-configuration cm
    - get tls-cert and tls-key from secret custom-tls and check for cert-manager annotations.
        If not present, take tls.key and tls.crt.
    - get username and password from initial-user job (will have different names depending on the geti version).
    reuse those values and start installation.
    """
    click.echo(UpgradeCmdTexts.gather_message)
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
    except UpgradeError as e:
        logger.error(f"Failed to gather info for migration: {e}")
        sys.exit(1)


def display_final_confirmation(config: UpgradeConfig, skip_confirmation_message: bool = False) -> None:
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

    if config.repoCA.value:
        click.echo(InstallCmdConfirmationTexts.root_ca_message.format(path=config.repoCA.value))
    else:
        click.echo(InstallCmdConfirmationTexts.no_root_ca_message)

    click.echo()
    click.echo(InstallCmdConfirmationTexts.confirm_data_message.format(path=config.data_folder.value))

    if not skip_confirmation_message:
        click.echo()
        click.confirm(InstallCmdConfirmationTexts.accept_config_prompt, default=True, abort=True)


def prepare_geti_for_migration(config: UpgradeConfig) -> None:
    """
    Prepare the Geti platform for migration.
    Delete everything except for secrets with credentials and custom-tls secret.
    Store secrets as a backup in the data folder.
    """
    click.echo(UpgradeCmdTexts.prepare_message)
    try:
        current_platform_version: str = get_current_platform_version(kubeconfig_path=K3S_KUBECONFIG_PATH)
    except ApiException as e:
        logger.exception(f"Failed to get current platform version: {e}")
        raise PlatformVersionError("Failed to get current platform version.") from e
    backup_location = os.path.join(config.data_folder.value, f"backup_data_{current_platform_version}")
    config.backup_location.value = backup_location

    with open(INSTALL_LOG_FILE_PATH, "a", encoding="utf-8") as log_file:
        # Remove the existing backup directory if it exists and create a new one
        subprocess_run(["rm", "-rf", backup_location], log_file)
        os.makedirs(backup_location, exist_ok=True)
        kafka = os.path.join(config.data_folder.value, "kafka")
        subprocess_run(["cp", "-r", kafka, backup_location], log_file)

    prepare_secrets(config=config)
    delete_namespaces()
    cleanup_main_ns()
    cleanup_kubelet_csr_approver()
    relabel_pv()
    cleanup_kafka_pv(config=config)
    cleanup_platform()


def prepare_secrets(config: UpgradeConfig) -> None:
    """
    Function that will back up secrets and label them with GETI_LABEL_KEY and GETI_LABEL_VALUE.
    """
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
                secret_data.metadata.annotations.update({"meta.helm.sh/release-name": TOOLS_CHART})
                core_api.patch_namespaced_secret(name=secret_name, namespace=PLATFORM_NAMESPACE, body=secret_data)
        except ApiException as e:
            logger.exception(f"Failed to prepared secrets: {e}")
            raise SecretsPreparationError("Failed to prepare secrets.") from e


def delete_namespaces() -> None:
    """
    Function that will delete all namespaces except for the main one.
    """
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    with kube_client.ApiClient() as client:
        core_api = kube_client.CoreV1Api(client)
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
                logger.exception(f"Failed to clean up platform: {e}")
                raise NamespaceCleanUpError("Failed to clean up platform.") from e


def _delete_resources(
    list_method,  # noqa: ANN001
    delete_method,  # noqa: ANN001
    resource_type,  # noqa: ANN001
    label_selector=EXCLUDE_LABEL_SELECTOR,  # noqa: ANN001
    namespaced: bool = False,
):
    """
    Helper function to delete resources from k3s
    """
    try:
        if namespaced:
            resources = list_method(namespace=PLATFORM_NAMESPACE, label_selector=label_selector)
        else:
            resources = list_method(label_selector=label_selector)
        for item in resources.items:
            if item.metadata.name == "default":
                # Do not delete default service account
                continue
            try:
                if namespaced:
                    delete_method(name=item.metadata.name, namespace=PLATFORM_NAMESPACE)
                else:
                    delete_method(name=item.metadata.name)
                logger.debug(f"Deleted {resource_type}: {item.metadata.name}")
            except ApiException as e:
                if e.status == 404:
                    logger.error(f"Resource {item.metadata.name} already deleted.")
                else:
                    logger.exception(f"Failed to delete {resource_type} {item.metadata.name}: {e}")
                    raise ResourceDeletionError from e
    except ApiException as e:
        logger.exception(f"Failed to list {resource_type}s: {e}")
        raise ResourceListError from e


def cleanup_platform() -> None:  # noqa: C901
    """
    Cleanup the platform by removing not needed resources.
    """
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    logger.info("Cleaning up platform resources...")
    with kube_client.ApiClient() as client:
        core_api = kube_client.CoreV1Api(client)
        try:
            core_api.delete_namespaced_secret(name=REGCRED_SECRET_NAME, namespace=KUBE_SYSTEM_NAMESPACE)
        except ApiException as e:
            if e.status == 404:
                logger.info(f"Secret {REGCRED_SECRET_NAME} already deleted.")
            else:
                logger.exception(
                    f"Failed to delete secret {REGCRED_SECRET_NAME} in namespace {KUBE_SYSTEM_NAMESPACE}: {e}"
                )
                raise ResourceDeletionError from e
        rbac_api = kube_client.RbacAuthorizationV1Api(client)
        cluster_roles = rbac_api.list_cluster_role(label_selector=EXCLUDE_LABEL_SELECTOR)
        for item in cluster_roles.items:
            if any(
                name in item.metadata.name
                for name in [
                    "dex",
                    "cert-manager",
                    "istio",
                    "kserve",
                    "impt",
                    "flyte",
                    "modelmesh",
                    "reloader",
                    "platform-cleaner",
                    "proxy-role",
                    "metrics-reader",
                    "cluster-role-gateway",
                ]
            ):
                try:
                    rbac_api.delete_cluster_role(name=item.metadata.name)
                    logger.debug(f"Deleted ClusterRole: {item.metadata.name}")
                except ApiException as e:
                    logger.exception(f"Failed to delete ClusterRole {item.metadata.name}: {e}")
                    raise ResourceDeletionError from e
        cluster_role_bindings = rbac_api.list_cluster_role_binding(label_selector=EXCLUDE_LABEL_SELECTOR)
        for item in cluster_role_bindings.items:
            if any(
                name in item.metadata.name
                for name in [
                    "dex",
                    "cert-manager",
                    "istio",
                    "kserve",
                    "impt",
                    "flyte",
                    "modelmesh",
                    "reloader",
                    "platform-cleaner",
                    "proxy-rolebinding",
                ]
            ):
                try:
                    rbac_api.delete_cluster_role_binding(name=item.metadata.name)
                    logger.debug(f"Deleted ClusterRoleBinding: {item.metadata.name}")
                except ApiException as e:
                    logger.exception(f"Failed to delete ClusterRoleBinding {item.metadata.name}: {e}")
                    raise ResourceDeletionError from e
        admission_reg_api = kube_client.AdmissionregistrationV1Api(client)
        _delete_resources(
            list_method=admission_reg_api.list_mutating_webhook_configuration,
            delete_method=admission_reg_api.delete_mutating_webhook_configuration,
            resource_type="MutatingWebhookConfiguration",
        )
        _delete_resources(
            list_method=admission_reg_api.list_validating_webhook_configuration,
            delete_method=admission_reg_api.delete_validating_webhook_configuration,
            resource_type="ValidatingWebhookConfiguration",
        )
        api_extensions = kube_client.ApiextensionsV1Api(client)
        custom_resources = api_extensions.list_custom_resource_definition(
            label_selector=EXCLUDE_LABEL_SELECTOR,
        )
        for item in custom_resources.items:
            if any(group in item.spec.group for group in ["dex", "cert-manager", "istio", "kserve", "flyte"]):
                try:
                    api_extensions.delete_custom_resource_definition(
                        name=item.metadata.name,
                    )
                    logger.debug(f"Deleted custom resource: {item.metadata.name}")
                except ApiException as e:
                    logger.exception(f"Failed to delete custom resource {item['metadata']['name']}: {e}")
                    raise ResourceDeletionError from e
    logger.info("Cleaned up platform resources...")


def cleanup_kubelet_csr_approver() -> None:
    """
    Cleanup the kubelet csr approver from system.
    """
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    logger.info("Deleting kubelet csr approver...")
    with kube_client.ApiClient() as client:
        try:
            app_api = kube_client.AppsV1Api(client)
            rbac_api = kube_client.RbacAuthorizationV1Api(client)
            core_api = kube_client.CoreV1Api(client)

            # Delete deployment, cluster role, and cluster role binding
            app_api.delete_namespaced_deployment(name=KUBELET_CSR_APPROVER_NAME, namespace=KUBE_SYSTEM_NAMESPACE)
            rbac_api.delete_cluster_role(name=KUBELET_CSR_APPROVER_NAME)
            rbac_api.delete_cluster_role_binding(name=KUBELET_CSR_APPROVER_NAME)

            # Delete service account
            core_api.delete_namespaced_service_account(name=KUBELET_CSR_APPROVER_NAME, namespace=KUBE_SYSTEM_NAMESPACE)

            # Delete secrets containing the approver name
            secrets = core_api.list_namespaced_secret(namespace=KUBE_SYSTEM_NAMESPACE)
            for secret in (s for s in secrets.items if KUBELET_CSR_APPROVER_NAME in s.metadata.name):
                core_api.delete_namespaced_secret(name=secret.metadata.name, namespace=KUBE_SYSTEM_NAMESPACE)

        except ApiException as e:
            if e.status == 404:
                logger.info("Kubelet csr approver components already deleted.")
            else:
                logger.error(f"Failed to delete kubelet csr approver components: {e}")
                raise ResourceDeletionError from e
    logger.info("Kubelet csr approver deleted successfully.")


def relabel_pv() -> None:
    """
    relabel pv components to fit new helm chart releases
    """
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    with kube_client.ApiClient() as client:
        core_api = kube_client.CoreV1Api(client)
        pv = core_api.read_persistent_volume(name=DATA_STORAGE_VOLUME_NAME)
        if not pv.metadata.annotations:
            pv.metadata.annotations = {}
        pv.metadata.annotations.update({"meta.helm.sh/release-name": PV_CHART})
        try:
            core_api.patch_persistent_volume(name=DATA_STORAGE_VOLUME_NAME, body=pv)
        except ApiException as e:
            logger.exception(f"Failed to patch pv {pv}: {e}")
            raise ResourcePatchError from e
        logger.info("Relabeled Persistent Volume.")

        pvc = core_api.read_namespaced_persistent_volume_claim(
            name=DATA_STORAGE_VOLUME_CLAIM_NAME, namespace=PLATFORM_NAMESPACE
        )
        if not pvc.metadata.annotations:
            pvc.metadata.annotations = {}
        pvc.metadata.annotations.update({"meta.helm.sh/release-name": PV_CHART})
        try:
            core_api.patch_namespaced_persistent_volume_claim(
                name=DATA_STORAGE_VOLUME_CLAIM_NAME, namespace=PLATFORM_NAMESPACE, body=pvc
            )
        except ApiException as e:
            logger.exception(f"Failed to patch pvc {pvc}: {e}")
            raise ResourcePatchError from e
        logger.info("Relabeled Persistent Volume Claim.")

        storage_api = kube_client.StorageV1Api(client)
        sc = storage_api.read_storage_class(name=STORAGE_CLASS)
        if not sc.metadata.annotations:
            sc.metadata.annotations = {}
        sc.metadata.annotations.update({"meta.helm.sh/release-name": PV_CHART})
        try:
            storage_api.patch_storage_class(name=STORAGE_CLASS, body=sc)
        except ApiException as e:
            logger.exception(f"Failed to patch storage class {sc}: {e}")
            raise ResourcePatchError from e
        logger.info("Relabeled Storage Class.")


def cleanup_kafka_pv(config: UpgradeConfig) -> None:
    """
    Removal of kafka directory stored in the data folder.
    """
    logger.info("Removing Kafka PV...")
    kafka_folder = os.path.join(config.data_folder.value, "kafka")
    with open(INSTALL_LOG_FILE_PATH, "a", encoding="utf-8") as log_file:
        # Remove the existing backup directory if it exists and create a new one
        try:
            subprocess_run(["rm", "-rf", kafka_folder], log_file)
        except subprocess.CalledProcessError as e:
            logger.exception(f"Failed to remove Kafka PV directory: {kafka_folder}")
            raise KafkaPVRemovalError from e
    logger.info("Kafka PV removed successfully.")


def cleanup_main_ns() -> None:
    """
    Cleanup the main namespace by removing all resources except for selected secrets.
    """
    logger.info("Cleaning up main namespace...")
    KubernetesConfigHandler(kube_config=K3S_KUBECONFIG_PATH)
    with kube_client.ApiClient() as client:
        app_api = kube_client.AppsV1Api(client)
        _delete_resources(
            list_method=app_api.list_namespaced_deployment,
            delete_method=app_api.delete_namespaced_deployment,
            resource_type="Deployment",
            namespaced=True,
        )
        _delete_resources(
            list_method=app_api.list_namespaced_daemon_set,
            delete_method=app_api.delete_namespaced_daemon_set,
            resource_type="DaemonSet",
            namespaced=True,
        )
        _delete_resources(
            list_method=app_api.list_namespaced_stateful_set,
            delete_method=app_api.delete_namespaced_stateful_set,
            resource_type="StatefulSet",
            namespaced=True,
        )
        batch_api = kube_client.BatchV1Api(client)
        _delete_resources(
            list_method=batch_api.list_namespaced_cron_job,
            delete_method=batch_api.delete_namespaced_cron_job,
            resource_type="CronJob",
            namespaced=True,
        )
        _delete_resources(
            list_method=batch_api.list_namespaced_job,
            delete_method=batch_api.delete_namespaced_job,
            resource_type="Job",
            namespaced=True,
        )
        core_api = kube_client.CoreV1Api(client)
        _delete_resources(
            list_method=core_api.list_namespaced_service,
            delete_method=core_api.delete_namespaced_service,
            resource_type="Service",
            namespaced=True,
        )
        _delete_resources(
            list_method=core_api.list_namespaced_secret,
            delete_method=core_api.delete_namespaced_secret,
            resource_type="Secret",
            namespaced=True,
        )
        _delete_resources(
            list_method=core_api.list_namespaced_config_map,
            delete_method=core_api.delete_namespaced_config_map,
            resource_type="ConfigMap",
            namespaced=True,
        )
        _delete_resources(
            list_method=core_api.list_namespaced_pod,
            delete_method=core_api.delete_namespaced_pod,
            resource_type="Pod",
            namespaced=True,
        )
        rbac_api = kube_client.RbacAuthorizationV1Api(client)
        _delete_resources(
            list_method=rbac_api.list_namespaced_role_binding,
            delete_method=rbac_api.delete_namespaced_role_binding,
            resource_type="RoleBinding",
            namespaced=True,
        )
        _delete_resources(
            list_method=rbac_api.list_namespaced_role,
            delete_method=rbac_api.delete_namespaced_role,
            resource_type="Role",
            namespaced=True,
        )
        _delete_resources(
            list_method=core_api.list_namespaced_service_account,
            delete_method=core_api.delete_namespaced_service_account,
            resource_type="ServiceAccount",
            namespaced=True,
        )
        autoscaling_api = kube_client.AutoscalingV1Api(client)
        _delete_resources(
            list_method=autoscaling_api.list_namespaced_horizontal_pod_autoscaler,
            delete_method=autoscaling_api.delete_namespaced_horizontal_pod_autoscaler,
            resource_type="HorizontalPodAutoscaler",
            namespaced=True,
        )
        pod_disruption_budget_api = kube_client.PolicyV1Api(client)
        _delete_resources(
            list_method=pod_disruption_budget_api.list_namespaced_pod_disruption_budget,
            delete_method=pod_disruption_budget_api.delete_namespaced_pod_disruption_budget,
            resource_type="PodDisruptionBudget",
            namespaced=True,
        )
        network_api = kube_client.NetworkingV1Api(client)
        _delete_resources(
            list_method=network_api.list_namespaced_network_policy,
            delete_method=network_api.delete_namespaced_network_policy,
            resource_type="NetworkPolicy",
            namespaced=True,
        )
        logger.info("Main namespace cleaned.")
        logger.info("Updating main namespace annotations...")
        main_ns = core_api.read_namespace(name=PLATFORM_NAMESPACE)
        if not main_ns.metadata.labels:
            main_ns.metadata.labels = {}
        main_ns.metadata.labels.update({"app.kubernetes.io/managed-by": "Helm"})
        if not main_ns.metadata.annotations:
            main_ns.metadata.annotations = {}
        main_ns.metadata.annotations.update(
            {"meta.helm.sh/release-name": NAMESPACE_CHART, "meta.helm.sh/release-namespace": DEFAULT_NAMESPACE}
        )
        try:
            core_api.patch_namespace(name=PLATFORM_NAMESPACE, body=main_ns)
        except ApiException as e:
            logger.exception(f"Failed to patch main namespace {PLATFORM_NAMESPACE}: {e}")
            raise ResourcePatchError from e
        logger.info("Main namespace annotations updated.")


def execute_migration(config: UpgradeConfig) -> None:
    """
    Execute the migration process.
    """
    click.echo(UpgradeCmdTexts.execution_start_message)
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

    click.echo(InstallCmdTexts.components_installing)
    run_geti_controller_installation(config)


@click.option("--repo-ca", type=click.Path(), callback=is_filepath_valid)
@click.option("--skip-confirmation-message", is_flag=True, help=InstallCmdTexts.skip_confirmation_help)
@click.command()
def upgrade(
    repo_ca: str | None = None,
    skip_confirmation_message: bool = False,
) -> None:
    """
    Upgrade Geti from "old" version without Geti controller.
    """
    click.echo(UpgradeCmdTexts.start_message)
    create_logs_dir()
    configure_logging()
    config = UpgradeConfig()
    run_initial_checks(config=config)
    config.repoCA.value = repo_ca
    gather_data_for_migration(config=config)

    display_final_confirmation(config=config, skip_confirmation_message=skip_confirmation_message)
    prepare_geti_for_migration(config=config)
    execute_migration(config=config)
