# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from enum import Enum

from pydantic import BaseModel


class OperationStatus(str, Enum):
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    ROLLING_BACK = "ROLLING_BACK"
    NOT_RUNNING = "NOT_RUNNING"
    COMPLETED = "COMPLETED"


class InstallationUpgradeProgressResponse(BaseModel):
    source_version: str
    target_version: str
    progress_percentage: int
    status: OperationStatus
    message: str
