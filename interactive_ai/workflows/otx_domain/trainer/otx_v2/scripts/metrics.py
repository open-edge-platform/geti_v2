# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import json
import logging
from argparse import Namespace
from pathlib import Path
from typing import Any

from lightning.pytorch.loggers.logger import Logger
from otx_io import upload_model_artifact

logger = logging.getLogger(__name__)


class OTXMetricsLogger(Logger):
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.metrics: dict[str, list[float]] = {}
        logger.info(f"Writing live metrics to {file_path}")

    @property
    def name(self) -> str | None:
        return None

    @property
    def version(self) -> int | str | None:
        return None

    def log_metrics(self, metrics: dict[str, float], step: int | None = None) -> None:  # noqa: ARG002
        for key, value in metrics.items():
            self.metrics.setdefault(key, []).append(value)

        with open(self.file_path, "w") as f:
            json.dump(self.metrics, f)

    def log_hyperparams(self, params: dict[str, Any] | Namespace, *args: Any, **kwargs: Any) -> None:
        pass

    def save(self) -> None:
        print(self.metrics)

    def finalize(self, status: str) -> None:  # noqa: ARG002
        upload_model_artifact(src_filepath=self.file_path, dst_filepath=Path("live_metrics/metrics.json"))
