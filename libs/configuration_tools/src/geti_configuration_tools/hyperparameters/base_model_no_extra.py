# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from pydantic import BaseModel, ConfigDict


class BaseModelNoExtra(BaseModel):
    """Base model class that do not allow for extra fields."""

    model_config = ConfigDict(extra="forbid")
