# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from enum import Enum, auto

from geti_logger_tools.logger_config import initialize_logger

logger = initialize_logger(__name__)


class FeatureFlag(Enum):
    FEATURE_FLAG_ANOMALY_REDUCTION = auto()
    FEATURE_FLAG_KEYPOINT_DETECTION = auto()
    FEATURE_FLAG_ASYNCHRONOUS_MEDIA_PREPROCESSING = auto()
