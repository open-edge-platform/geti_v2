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
