# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module containing exceptions raised by checks functions.
"""

import subprocess


class PathCreationError(Exception):
    """
    Error raised by function used to create path.
    """


class StepsError(subprocess.SubprocessError):
    """
    Error raised by steps function.
    """


class ChartInstallationError(StepsError):
    """
    Error raised by function used to install/upgrade charts.
    """


class ChartPullError(StepsError):
    """
    Error raised by function used to pull charts.
    """


class ExtractRegistryDataError(StepsError):
    """
    Error raised by function used to extract registry data.
    """


class CreatePlatformDirectoryError(StepsError):
    """
    Error raised by function used to create platform directory.
    """


class CopyPlatformChartsError(StepsError):
    """
    Error raised by function used to copy platform charts.
    """


class InstallSystemPackagesError(StepsError):
    """
    Error raised by function used to install system packages.
    """


class DownloadSystemPackagesError(StepsError):
    """
    Exception raised when an error occurs while downloading system packages.
    """


class GenerateTemplateError(StepsError):
    """
    Error raised by function used to render template.
    """


class UpgradeError(StepsError):
    """
    Exception raised when an error occurs while migrating the platform
    """


class PVInfoError(UpgradeError):
    """
    Exception raised when an error occurs while getting PV info
    """


class TLSCertificateInfoError(UpgradeError):
    """
    Exception raised when an error occurs while getting TLS certificate info
    """


class TLSCertificateEmptyError(UpgradeError):
    """
    Exception raised when an error occurs while getting TLS certificate info
    """


class HelmReleaseError(UpgradeError):
    """
    Exception raised when an error occurs while getting Helm release info
    """


class CredentialsError(UpgradeError):
    """
    Exception raised when an error occurs while getting credentials info
    """


class PlatformVersionError(UpgradeError):
    """
    Exception raised when an error occurs while getting credentials info
    """


class SecretsPreparationError(UpgradeError):
    """
    Exception raised when an error occurs while preparing secrets for migration
    """


class PlatformCleanUpError(UpgradeError):
    """
    Exception raised when an error occurs while preparing secrets for migration
    """


class NamespaceCleanUpError(UpgradeError):
    """
    Exception raised when an error occurs while cleaning up namespaces
    """


class ResourceDeletionError(UpgradeError):
    """
    Exception raised when an error occurs while deleting resources
    """


class ResourceListError(UpgradeError):
    """
    Exception raised when an error occurs while listing resources
    """


class ResourcePatchError(UpgradeError):
    """
    Exception raised when an error occurs while patching resources
    """


class KafkaPVRemovalError(UpgradeError):
    """
    Exception raised when an error occurs while removing Kafka PVs
    """
