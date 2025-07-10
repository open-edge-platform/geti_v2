# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from dataclasses import dataclass

from geti_types import ID


@dataclass
class ModelIdentifier:
    """
    Model Identifier to identify models
    """

    model_storage_id: ID
    model_id: ID
