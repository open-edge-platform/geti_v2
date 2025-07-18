# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
"""
Module with definition of all charts used to deploy Geti
"""

from dataclasses import dataclass


@dataclass
class ChartDefinition:
    name: str
    directory: str
    namespace: str
    values_file: str = ""
    values_template_file: str = ""


# TODO remove unnecessary charts (probably all except for GetiController)

GETI_CONTROLLER_CHART = ChartDefinition(
    name="geti-controller",
    directory="geti_controller_chart",
    namespace="default",
)
