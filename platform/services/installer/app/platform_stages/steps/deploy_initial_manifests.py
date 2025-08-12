# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from collections import namedtuple

from kubernetes.client import ApiException

from platform_configuration.features import FeatureFlag, is_feature_flag_enabled
from platform_stages.steps.errors import NamespaceCreationError, PatchServiceAccountError
from platform_utils.k8s import create_namespace, disable_automount_service_account_token

Namespace = namedtuple("Namespace", ["name", "labels", "annotations"])  # noqa: PYI024

AMBIENT_MESH: bool = is_feature_flag_enabled(FeatureFlag.AMBIENT_MESH)

IMPT = Namespace(
    name="impt",
    # TODO store waypoint name in some config / const?
    labels={"istio-injection": "enabled", "opa-istio-injection": "enabled"}
    if not AMBIENT_MESH
    else {"istio.io/dataplane-mode": "ambient", "istio.io/use-waypoint": "istio-waypoint"},
    annotations={},
)

OPA_ISTIO = Namespace(
    name="opa-istio",
    labels={"istio-injection": "enabled", "app.kubernetes.io/managed-by": "Helm"}
    if not AMBIENT_MESH
    else {"app.kubernetes.io/managed-by": "Helm", "istio.io/dataplane-mode": "ambient"},
    annotations={"meta.helm.sh/release-name": "opa", "meta.helm.sh/release-namespace": "impt"},
)

ISTIO_SYSTEM = Namespace(
    name="istio-system",
    labels={},
    annotations={},
)
ISTIO_INGRESS = Namespace(
    name="istio-ingress",
    labels={"istio.io/dataplane-mode": "ambient"},
    annotations={},
)
CERT_MANAGER = Namespace(
    name="cert-manager",
    labels={},
    annotations={},
)

FLYTE = Namespace(
    name="flyte",
    labels={"istio-injection": "enabled"} if not AMBIENT_MESH else {"istio.io/dataplane-mode": "ambient"},
    annotations={},
)

IMPT_JOBS_PRODUCTION = Namespace(
    name="impt-jobs-production",
    labels={"istio-injection": "enabled", "app.kubernetes.io/managed-by": "Helm"}
    if not AMBIENT_MESH
    else {"app.kubernetes.io/managed-by": "Helm", "istio.io/dataplane-mode": "ambient"},
    annotations={
        "meta.helm.sh/release-name": "impt",
        "meta.helm.sh/release-namespace": "impt",
    },
)

REQUIRED_NAMESPACES = [IMPT, OPA_ISTIO, ISTIO_SYSTEM, CERT_MANAGER, FLYTE, IMPT_JOBS_PRODUCTION]


def deploy_initial_manifests() -> None:
    """
    Method used to deploy namespace with labels and annotations.
    It will also patch default service account to disable automount token.
    """
    if AMBIENT_MESH:
        REQUIRED_NAMESPACES.append(ISTIO_INGRESS)

    for namespace in REQUIRED_NAMESPACES:
        try:
            create_namespace(
                name=namespace.name,
                labels=namespace.labels,
                annotations=namespace.annotations,
            )
        except ApiException as ex:
            raise NamespaceCreationError from ex
        try:
            disable_automount_service_account_token(namespace=namespace.name)
        except ApiException as ex:
            raise PatchServiceAccountError from ex
