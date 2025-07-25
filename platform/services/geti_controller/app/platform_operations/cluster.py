# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import datetime
import http
import logging
import os
import re
import time

from kubernetes import client, config
from kubernetes.client import (
    RbacV1Subject,
    V1ClusterRole,
    V1ClusterRoleBinding,
    V1Container,
    V1ContainerPort,
    V1EnvVar,
    V1EnvVarSource,
    V1Job,
    V1JobSpec,
    V1ObjectMeta,
    V1PodSpec,
    V1PodTemplateSpec,
    V1PolicyRule,
    V1RoleRef,
    V1SecretKeySelector,
    V1Service,
    V1ServiceAccount,
    V1ServicePort,
)
from kubernetes.client.rest import ApiException
from packaging.version import Version

from constants.platform import NAMESPACE, SERVICE_NAME

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def load_kube_config() -> None:
    """Load Kubernetes configuration to avoid importing kubernetes lib to other modules"""
    try:
        config.load_incluster_config()
        logger.info("Loaded in-cluster Kubernetes configuration.")
    except config.ConfigException as e:
        logger.error(f"Failed to load in-cluster configuration: {e}")
        raise


def check_namespace_exists(namespace: str) -> bool:
    """Check if a namespace exists."""
    v1 = client.CoreV1Api()
    try:
        v1.read_namespace(name=namespace)
        logger.info(f"Namespace '{namespace}' exists.")
        return True
    except ApiException as e:
        if e.status == 404:
            logger.error(f"Namespace '{namespace}' does not exist.")
            return False
        logger.error(f"An error occurred while checking namespace: {e}")
        return False


def check_config_map_exists(name: str, namespace: str) -> bool:
    """Check if a ConfigMap exists in the specified namespace."""
    v1 = client.CoreV1Api()
    if not check_namespace_exists(namespace):
        logger.error(f"Cannot check ConfigMap '{name}' because namespace '{namespace}' does not exist.")
        return False

    try:
        v1.read_namespaced_config_map(name=name, namespace=namespace)
        logger.info(f"ConfigMap '{name}' exists in the '{namespace}' namespace.")
        return True
    except ApiException as e:
        if e.status == 404:
            logger.error(f"ConfigMap '{name}' does not exist in the '{namespace}' namespace.")
            return False
        logger.error(f"An error occurred: {e}")
        return False


def create_service_account(name: str, namespace: str) -> V1ServiceAccount:
    """Create a ServiceAccount object."""
    return V1ServiceAccount(metadata=V1ObjectMeta(name=name, namespace=namespace))


def create_service(name: str, namespace: str, selector: dict, port: int = 8000) -> V1Service:
    """Create a Service object."""
    return V1Service(
        metadata=V1ObjectMeta(name=name, namespace=namespace),
        spec=client.V1ServiceSpec(
            selector=selector, ports=[V1ServicePort(port=port, target_port=port)], type="ClusterIP"
        ),
    )


def create_cluster_role(name: str) -> V1ClusterRole:
    """Create a ClusterRole object."""
    return V1ClusterRole(
        metadata=V1ObjectMeta(name=name),
        rules=[
            V1PolicyRule(api_groups=["helm.cattle.io"], resources=["helmcharts"], verbs=["create", "patch"]),
            V1PolicyRule(api_groups=["batch"], resources=["jobs"], verbs=["list", "watch"]),
            V1PolicyRule(api_groups=[""], resources=["secrets"], verbs=["create", "patch", "update"]),
        ],
    )


def create_cluster_role_binding(name: str, service_account_name: str, namespace: str) -> V1ClusterRoleBinding:
    """Create a ClusterRoleBinding object."""
    return V1ClusterRoleBinding(
        metadata=V1ObjectMeta(name=name),
        role_ref=V1RoleRef(api_group="rbac.authorization.k8s.io", kind="ClusterRole", name=name),
        subjects=[RbacV1Subject(kind="ServiceAccount", name=service_account_name, namespace=namespace)],
    )


def deploy_service(service: V1Service, namespace: str) -> None:
    """Deploy a Service to the specified namespace."""
    v1 = client.CoreV1Api()
    try:
        v1.create_namespaced_service(namespace=namespace, body=service)
        logger.info(f"Service '{service.metadata.name}' deployed successfully in namespace '{namespace}'.")
    except ApiException as e:
        if e.status == http.HTTPStatus.CONFLICT:
            logger.warning(f"Service '{service.metadata.name}' already exists, attempting to patch it.")
            try:
                v1.patch_namespaced_service(name=service.metadata.name, namespace=namespace, body=service)
                logger.info(f"Service '{service.metadata.name}' patched successfully in namespace '{namespace}'.")
            except ApiException as inner:
                logger.error(f"An error occurred: {inner}")
        else:
            logger.error(f"An error occurred: {e}")


def deploy_service_account(service_account: V1ServiceAccount, namespace: str) -> None:
    """Deploy a ServiceAccount to the specified namespace."""
    v1 = client.CoreV1Api()
    try:
        v1.create_namespaced_service_account(namespace=namespace, body=service_account)
        logger.info(
            f"ServiceAccount '{service_account.metadata.name}' deployed successfully in namespace '{namespace}'."
        )
    except ApiException as e:
        logger.error(f"An error occurred: {e}")


def deploy_cluster_role(cluster_role: V1ClusterRole) -> None:
    """Deploy a ClusterRole."""
    rbac_v1 = client.RbacAuthorizationV1Api()
    try:
        rbac_v1.create_cluster_role(body=cluster_role)
        logger.info(f"ClusterRole '{cluster_role.metadata.name}' deployed successfully.")
    except ApiException as e:
        if e.status == http.HTTPStatus.CONFLICT:
            logger.warning(f"ClusterRole '{cluster_role.metadata.name}' already exists, skipping creation.")
        else:
            logger.error(f"An error occurred: {e}")


def deploy_cluster_role_binding(cluster_role_binding: V1ClusterRoleBinding) -> None:
    """Deploy a ClusterRoleBinding."""
    rbac_v1 = client.RbacAuthorizationV1Api()
    try:
        rbac_v1.create_cluster_role_binding(body=cluster_role_binding)
        logger.info(f"ClusterRoleBinding '{cluster_role_binding.metadata.name}' deployed successfully.")
    except ApiException as e:
        logger.error(f"An error occurred: {e}")


def create_job(
    name: str,
    image: str,
    registry: str,
    manifest_version: str,
    port: int,
    gpu_label: str | None = None,
    render_gid: int | None = None,
) -> V1Job:
    """Create a Job object."""
    http_proxy = os.getenv("HTTP_PROXY")
    https_proxy = os.getenv("HTTPS_PROXY")
    no_proxy = os.getenv("NO_PROXY") or ""
    image_registry = os.getenv("IMAGE_REGISTRY")
    repo_ca = os.getenv("REPO_CA")
    logger.info(f"Repo CA '{repo_ca}'")
    short_name = name.split("-")[0]
    container = V1Container(
        name=short_name,
        image=image,
        image_pull_policy="Always",
        command=["python3"],
        args=["job.py"],
        env=[
            V1EnvVar(name="GETI_REGISTRY", value=registry),
            V1EnvVar(name="GETI_MANIFEST_VERSION", value=manifest_version),
            V1EnvVar(name="GPU_LABEL", value=gpu_label or ""),
            V1EnvVar(name="RENDER_GID", value=str(render_gid) if render_gid else ""),
            V1EnvVar(
                name="DATA_FOLDER",
                value_from=V1EnvVarSource(
                    secret_key_ref=V1SecretKeySelector(name="geti-install-data", key="dataFolder", optional=True)
                ),
            ),
            V1EnvVar(
                name="USERNAME",
                value_from=V1EnvVarSource(
                    secret_key_ref=V1SecretKeySelector(name="geti-install-data", key="login", optional=True)
                ),
            ),
            V1EnvVar(
                name="PASSWORD_HASH",
                value_from=V1EnvVarSource(
                    secret_key_ref=V1SecretKeySelector(name="geti-install-data", key="passwordHash", optional=True)
                ),
            ),
            V1EnvVar(
                name="PROXY_ENABLED",
                value=str(bool(http_proxy or https_proxy)),
            ),
            V1EnvVar(
                name="HTTPS_PROXY",
                value=https_proxy,
            ),
            V1EnvVar(
                name="HTTP_PROXY",
                value=http_proxy,
            ),
            V1EnvVar(
                name="NO_PROXY",
                value=no_proxy,
            ),
            V1EnvVar(
                name="TLS_CERT",
                value_from=V1EnvVarSource(
                    secret_key_ref=V1SecretKeySelector(name="geti-install-data", key="tlsCert", optional=True)
                ),
            ),
            V1EnvVar(
                name="TLS_KEY",
                value_from=V1EnvVarSource(
                    secret_key_ref=V1SecretKeySelector(name="geti-install-data", key="tlsKey", optional=True)
                ),
            ),
            *([V1EnvVar(name="IMAGE_REGISTRY", value=image_registry)] if image_registry else []),
            *([V1EnvVar(name="REPO_CA", value=repo_ca)] if repo_ca else []),
        ],
        ports=[V1ContainerPort(container_port=port)],
    )

    pod_spec = V1PodSpec(containers=[container], restart_policy="Never", service_account_name=name)

    pod_template = V1PodTemplateSpec(metadata=V1ObjectMeta(labels={"direction": short_name}), spec=pod_spec)

    job_spec = V1JobSpec(template=pod_template, backoff_limit=0)

    return V1Job(api_version="batch/v1", kind="Job", metadata=V1ObjectMeta(name=name), spec=job_spec)


def deploy_job(job: V1Job, namespace: str) -> None:
    """Deploy a Job to the specified namespace."""
    batch_v1 = client.BatchV1Api()
    try:
        batch_v1.create_namespaced_job(namespace=namespace, body=job)
        logger.info(f"Job '{job.metadata.name}' deployed successfully in namespace '{namespace}'.")
    except ApiException as e:
        logger.error(f"An error occurred: {e}")


def is_job_completed_or_failed(namespace: str) -> tuple[bool, str]:
    """
    Check if the job is completed or failed.
    Returns (is_finished, status_message)
    """
    matching_jobs = []
    load_kube_config()
    try:
        batch_v1 = client.BatchV1Api()
        jobs = batch_v1.list_namespaced_job(namespace=namespace)
        for job in jobs.items:
            match = re.search(r"\d{14}", job.metadata.name)
            if match:
                timestamp = match.group()
                matching_jobs.append((job.metadata.name, timestamp))

        if not matching_jobs:
            logger.info(f"No matching jobs found in namespace '{namespace}'.")
            return False, "No jobs found"

        latest_job = max(matching_jobs, key=lambda x: x[1])
        logger.debug(f"Latest job in namespace '{namespace}': {latest_job}")

        job = batch_v1.read_namespaced_job(name=latest_job[0], namespace=namespace)
        status = job.status

        if status.succeeded is not None and status.succeeded > 0:
            return True, "Job completed successfully"
        if status.failed is not None and status.failed > 0:
            return True, "Job failed"
        if status.active is not None and status.active > 0:
            return False, "Job is running"
        return False, "Job status unclear"
    except Exception as e:
        logger.exception("Failed to check job status")
        return False, f"Error checking job status: {e}"


def is_job_running(namespace: str = "default") -> bool:
    """
    Check if the Kubernetes job is still running.
    """
    load_kube_config()
    running_jobs = []
    try:
        batch_v1 = client.BatchV1Api()
        jobs = batch_v1.list_namespaced_job(namespace=namespace)
        for job in jobs.items:
            if job.status.active and job.status.active > 0:
                match = re.search(r"\d{14}", job.metadata.name)
                if match:
                    timestamp = match.group()
                    running_jobs.append((job.metadata.name, timestamp))
        latest_job = max(running_jobs, key=lambda x: x[1], default=None)
        return bool(latest_job[0])
    except client.exceptions.ApiException as e:
        logger.error(f"Failed to get job status: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error checking job status: {e}")
        return False


def wait_for_job_creation(namespace: str, timeout: int = 300, interval: int = 10) -> None:
    """
    Waits for the job to be created and ready in the specified namespace.

    :param namespace: The namespace where the job should be running.
    :param timeout: Maximum time to wait for the job creation in seconds.
    :param interval: Time interval between checks in seconds.
    """
    logger.debug(f"Waiting for job  to be created in namespace '{namespace}'.")
    start_time = time.time()

    while time.time() - start_time < timeout:
        if is_job_running(namespace):
            logger.debug("Job is now running.")
            return
        logger.debug(f"Job  not found, retrying in {interval} seconds...")
        time.sleep(interval)

    logger.error(f"Timeout reached: Job was not created within {timeout} seconds.")
    raise TimeoutError(f"Job was not created within {timeout} seconds.")


def deploy_service_job(
    registry: str | None = None,
    image_tag: str | None = None,
    manifest_version: str | None = None,
    port: int = 8000,
    direction: str = "install",
    gpu_label: str | None = None,
    render_gid: int | None = None,
) -> None:
    """
    Deploys the installation and upgrade job for the platform.
    This function sets up the necessary Kubernetes resources such as services, service accounts,
    cluster roles, and bindings, and then deploys the job that performs the installation or upgrade.
    """
    current_timestamp = datetime.datetime.now()

    # Format the timestamp as a string
    timestamp_string = current_timestamp.strftime("%Y%m%d%H%M%S")
    version = Version(re.match(r"^\d+\.\d+\.\d+", image_tag).group())
    prepared_name = f"{direction}-job-{version}-{timestamp_string}"
    load_kube_config()
    se = create_service(name=SERVICE_NAME, namespace=NAMESPACE, selector={"direction": direction})
    sa = create_service_account(name=prepared_name, namespace=NAMESPACE)
    cr = create_cluster_role(name=prepared_name)
    crb = create_cluster_role_binding(name=prepared_name, service_account_name=prepared_name, namespace=NAMESPACE)
    deploy_service(se, namespace=NAMESPACE)
    deploy_service_account(sa, namespace=NAMESPACE)
    deploy_cluster_role(cr)
    deploy_cluster_role_binding(crb)
    job = create_job(
        name=prepared_name,
        registry=registry,
        image=f"{registry}/geti/install-upgrade:{image_tag}",
        manifest_version=manifest_version,
        port=port,
        gpu_label=gpu_label,
        render_gid=render_gid,
    )
    deploy_job(job, namespace="default")
