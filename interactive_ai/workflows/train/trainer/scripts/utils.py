# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from __future__ import annotations

import logging
import time
from dataclasses import asdict, dataclass
from enum import Enum
from functools import wraps
from typing import TYPE_CHECKING

import yaml
from otx.tools.converter import GetiConfigConverter
from otx.types.export import OTXExportFormatType
from otx.types.precision import OTXPrecisionType

if TYPE_CHECKING:
    from collections.abc import Callable
    from pathlib import Path

BASE_MODEL_FILENAME = "model_fp32_xai.pth"


def logging_elapsed_time(logger: logging.Logger, log_level: int = logging.INFO) -> Callable:
    """Decorate a function to log its elapsed time.

    :param logger: Python logger to log the elapsed time.
    :param log_level: Logging level to log the elapsed time.
    """

    def _decorator(func: Callable):
        @wraps(func)
        def _wrapped(*args, **kwargs):
            msg = f"Starting: {func.__name__}"
            logger.log(level=log_level, msg=msg)

            t_start = time.time()
            outputs = func(*args, **kwargs)
            t_elapsed = (time.time() - t_start) * 1e3

            msg = f"Finishing: {func.__name__}, Elapsed time: {t_elapsed:.1f} ms"

            return outputs

        return _wrapped

    return _decorator


class JobType(str, Enum):
    TRAIN = "train"
    OPTIMIZE_POT = "optimize_pot"


class OptimizationType(str, Enum):
    POT = "POT"


class ExportFormat(str, Enum):
    BASE_FRAMEWORK = "BASE_FRAMEWORK"
    OPENVINO = "OPENVINO"
    ONNX = "ONNX"


class PrecisionType(str, Enum):
    FP32 = "FP32"
    FP16 = "FP16"
    INT8 = "INT8"


@dataclass
class ExportParameter:
    """
    config.yaml's export_parameters item model.
    """

    export_format: ExportFormat
    precision: PrecisionType = PrecisionType.FP32
    with_xai: bool = False

    def to_artifact_fnames(self) -> list[str]:
        fname = "model_"
        precision_name = (
            self.precision.name.lower() + "-pot"
            if self.precision == PrecisionType.INT8
            else self.precision.name.lower()
        )
        fname += precision_name + "_"
        if self.with_xai:
            fname += "xai"
        else:
            fname += "non-xai"

        export_formats = {
            ExportFormat.OPENVINO: [f"{fname}.bin", f"{fname}.xml"],
            ExportFormat.ONNX: [f"{fname}.onnx"],
            ExportFormat.BASE_FRAMEWORK: [f"{fname}.pth"],
        }
        if self.export_format in export_formats:
            return export_formats[self.export_format]

        raise ValueError(f"Unsupported export format {self.export_format}")

    def to_otx2_export_format(self) -> OTXExportFormatType:
        if self.export_format == ExportFormat.OPENVINO:
            return OTXExportFormatType.OPENVINO
        if self.export_format == ExportFormat.ONNX:
            return OTXExportFormatType.ONNX

        raise ValueError(self.export_format)

    def to_otx2_precision(self) -> OTXPrecisionType:
        if self.precision == PrecisionType.FP32:
            return OTXPrecisionType.FP32
        if self.precision == PrecisionType.FP16:
            return OTXPrecisionType.FP16

        raise ValueError(self.precision)


def str2bool(value: str | bool) -> bool:
    """Convert given value to boolean."""
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        if value.lower() == "true":
            return True
        if value.lower() == "false":
            return False
        raise ValueError(value)

    raise TypeError(value)


@dataclass(frozen=True)
class OTXConfig:
    job_type: JobType
    model_manifest_id: str
    hyper_parameters: dict | None
    export_parameters: list[ExportParameter]
    optimization_type: OptimizationType | None
    sub_task_type: str | None = None

    @classmethod
    def from_yaml_file(cls, config_file_path: Path) -> OTXConfig:
        with open(config_file_path) as fp:
            config: dict = yaml.safe_load(fp)

        return OTXConfig(
            job_type=JobType(config["job_type"]),
            model_manifest_id=config["model_manifest_id"],
            hyper_parameters=config.get("hyperparameters"),
            export_parameters=[
                ExportParameter(
                    export_format=ExportFormat(cfg["format"].upper()),
                    precision=PrecisionType(cfg["precision"].upper()),
                    with_xai=str2bool(cfg["with_xai"]),
                )
                for cfg in config.get("export_models", [])
            ],
            optimization_type=OptimizationType.POT if config["job_type"] == "optimize_pot" else None,
            sub_task_type=config.get("sub_task_type"),
        )

    def to_otx2_config(self) -> dict[str, dict]:
        """Convert OTXConfig to OTX2 config format."""
        otx2_config = GetiConfigConverter.convert(asdict(self))

        otx2_config["data"]["data_format"] = "arrow"
        otx2_config["data"]["train_subset"]["subset_name"] = "TRAINING"
        otx2_config["data"]["val_subset"]["subset_name"] = "VALIDATION"
        otx2_config["data"]["test_subset"]["subset_name"] = "TESTING"

        return otx2_config
