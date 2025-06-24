# INTEL CONFIDENTIAL
#
# Copyright (C) 2024 Intel Corporation
#
# This software and the related documents are Intel copyrighted materials, and your use of them is governed by
# the express license under which they were provided to you ("License"). Unless the License provides otherwise,
# you may not use, modify, copy, publish, distribute, disclose or transmit this software or the related documents
# without Intel's prior written permission.
#
# This software and the related documents are provided as is, with no express or implied warranties,
# other than those that are expressly stated in the License.
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
