# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
"""Module containing other common variables used in the platform installer"""

import os

PLATFORM_NAMESPACE = "impt"

PLATFORM_CONFIGURATION_CM_NAME = f"{PLATFORM_NAMESPACE}-configuration"
PLATFORM_VERSION_CM_KEY = "platformVersion"

DATA_DIRS_REMOVAL_REQUIRED = ["mongodb", "ldap", "ldap-config"]
DATA_STORAGE_VOLUME_NAME = "data-storage-volume"
STORAGE_CLASS = "local-storage"
DATA_STORAGE_VOLUME_CLAIM_NAME = f"{DATA_STORAGE_VOLUME_NAME}-claim"

INTERNAL_REGISTRY_ADDRESS = "127.0.0.1:30000"
PLATFORM_REGISTRY_ADDRESS = os.getenv("PLATFORM_REGISTRY_ADDRESS", "ghcr.io")
EXTERNAL_REGISTRY_ADDRESS = os.getenv("EXTERNAL_REGISTRY_ADDRESS", "")
PLATFORM_BUILD_VERSION = os.getenv("PLATFORM_BUILD_VERSION", "")

INTEL_EMAIL = "Geti.Team@intel.com"

GPU_PROVIDER_NVIDIA = "nvidia"
GPU_PROVIDER_INTEL_MAX = "intel-max"
GPU_PROVIDER_INTEL_ARC = "intel-arc"
GPU_PROVIDER_INTEL_ARC_A = "intel-arc-a"

DEFAULT_HISTORY_MAX = 3

DEFAULT_USERNAME = "admin@geti.com"

# Geti namespaces
ISTIO_NAMESPACE = "istio-system"
PLATFORM_NAMESPACE = "impt"
OPA_NAMESPACE = "opa-istio"
CERT_MANAGER_NAMESPACE = "cert-manager"
FLYTE_NAMESPACE = "flyte"
JOBS_PRODUCTION_NAMESPACE = "impt-jobs-production"
KUBE_SYSTEM_NAMESPACE = "kube-system"
DEFAULT_NAMESPACE = "default"

# Secret names
CUSTOM_TLS_SECRET_NAME = "custom-tls"  # noqa: S105
MONGODB_SECRET_NAME = "impt-mongodb"  # noqa: S105
POSTGRESQL_SECRET_NAME = "impt-postgresql"  # noqa: S105
SPICEDB_SECRET_NAME = "impt-spice-db"  # noqa: S105
LDAP_SECRET_NAME = "impt-ldap-service-user"  # noqa: S105
SEAWEEDFS_SECRET_NAME = "impt-seaweed-fs"  # noqa: S105
REGCRED_SECRET_NAME = "regcred"  # noqa: S105

GETI_LABEL_KEY = "needed_by_geti"
GETI_LABEL_VALUE = "true"
KUBELET_CSR_APPROVER_NAME = "kubelet-csr-approver"

PV_CHART = "geti-pv-creation"
NAMESPACE_CHART = "geti-namespaces"
TOOLS_CHART = "geti-tools"
