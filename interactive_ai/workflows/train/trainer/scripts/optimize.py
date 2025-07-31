# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from otx.backend.openvino.engine import OVEngine
from otx.tools.converter import GetiConfigConverter
from otx_io import load_trained_model_weights, save_exported_model
from progress_updater import ProgressUpdater, TrainingStage
from utils import OptimizationType, OTXConfig, PrecisionType, logging_elapsed_time

if TYPE_CHECKING:
    from pathlib import Path

logger = logging.getLogger("otx_job")


@logging_elapsed_time(logger=logger)
def optimize(
    config: OTXConfig,
    dataset_dir: Path,
    work_dir: Path,
) -> None:
    """Execute OTX model optimize."""
    if config.optimization_type != OptimizationType.POT:
        msg = "OTX2 can only support OptimizationType.POT."
        raise ValueError(msg, config.optimization_type)

    if len(config.export_parameters) != 1:
        msg = "There should be exactly one export parameter."
        raise ValueError(msg, config.export_parameters)

    export_param = next(iter(config.export_parameters))

    if export_param.precision != PrecisionType.INT8 or export_param.with_xai:
        msg = "Invalid export parameter."
        raise ValueError(msg, export_param)

    progress_updater = ProgressUpdater(
        stage=TrainingStage.OPTIMIZATION,
        n_processes=1,
        interval=2.0,
    )
    progress_updater.update_progress(0.0)

    checkpoint = load_trained_model_weights(work_dir=work_dir, optimize=True)
    if checkpoint is None:
        raise RuntimeError("Cannot get checkpoint for optimization.")
    otx_config = config.to_otx2_config()
    datamodule = GetiConfigConverter.instantiate_datamodule(config=otx_config, data_root=str(dataset_dir))
    ov_engine = OVEngine(model=checkpoint, data=datamodule, work_dir=str(work_dir / "otx-workspace"))
    logger.debug("Checkpoint is loaded. Starting optimization.")
    optimized_path = ov_engine.optimize()

    logger.debug("Optimization is completed. Saving optimized models.")
    save_exported_model(
        export_dir=optimized_path.parent,
        export_param=export_param,
    )

    logger.debug("Optimized model is saved.")
    progress_updater.update_progress(100.0)
