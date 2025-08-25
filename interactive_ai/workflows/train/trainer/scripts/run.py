# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from __future__ import annotations

import logging
import os
from pathlib import Path
from tempfile import TemporaryDirectory

from optimize import optimize
from otx_io import AsyncCaller, download_config_file, download_shard_files, upload_error_log, upload_full_log
from pretrained_weights import download_pretrained_weights
from train import train
from utils import JobType, OTXConfig, logging_elapsed_time

logger = logging.getLogger("otx_job")


@logging_elapsed_time(logger=logger, log_level=logging.INFO)
def execute(work_dir: Path) -> None:
    """Execute an OTX job by dispatching according to the given job type."""

    config_file_path = download_config_file()
    shard_files_dir = download_shard_files()

    config = OTXConfig.from_yaml_file(config_file_path=config_file_path)

    job_type = config.job_type
    download_pretrained_weights(work_dir=work_dir, template_id=config.model_manifest_id)

    if job_type == JobType.TRAIN:
        logger.debug("Starting training job.")
        train(
            config=config,
            dataset_dir=shard_files_dir,
            work_dir=work_dir,
        )
        logger.debug("Training job completed.")
    elif job_type == JobType.OPTIMIZE_POT:
        logger.debug("Starting POT job.")
        optimize(
            config=config,
            dataset_dir=shard_files_dir,
            work_dir=work_dir,
        )
        logger.debug("POT job completed.")
    else:
        raise ValueError


if __name__ == "__main__":
    client = None
    log_file = "otx-full.log"
    # Add File logging handler
    root_logger = logging.getLogger(None)
    root_logger.addHandler(
        logging.FileHandler(
            filename=log_file,
            mode="w",
        )
    )

    with open("primary.pid", "w") as fp:
        pid = os.getpid()
        fp.write(str(pid))
        logger.info(f"Primary PID: {pid}")

    try:
        AsyncCaller().start()

        with TemporaryDirectory() as tmpdir:
            work_dir = Path(tmpdir)
            logger.debug("Start main execute() process.")
            execute(work_dir=work_dir)

        Path("/tmp/training_completed").touch()  # noqa: S108
    except Exception as exception:
        upload_error_log(exception=exception)
        raise  # Reraise
    finally:
        root_logger.debug("Start AsyncCaller().close() process.")
        AsyncCaller().close()

        root_logger.debug(f"Start upload_full_log() process, log_file exists:{Path(log_file).exists()}")
        if Path(log_file).exists():
            full_log_text = Path(log_file).read_text()
            upload_full_log(full_log_text=full_log_text)
        root_logger.debug("Finished upload_full_log() process.")
