# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from __future__ import annotations

import json
import logging
import os
import re
import traceback
from functools import partial, wraps
from pathlib import Path
from queue import Queue
from tempfile import TemporaryDirectory
from threading import Thread
from typing import TYPE_CHECKING, ClassVar

import requests
from s3_client import S3ClientSingleton
from tqdm import tqdm
from utils import BASE_MODEL_FILENAME, ExportFormat, ExportParameter, PrecisionType, logging_elapsed_time

if TYPE_CHECKING:
    import io
    from collections.abc import Callable

TIMEOUT = 300.0

logger = logging.getLogger(__name__)


def _get_bucket_name() -> str:
    return os.environ.get("BUCKET_NAME_MLFLOWEXPERIMENTS", "mlflowexperiments")


def _get_object_name_base() -> Path:
    config_json = os.environ.get("IDENTIFIER_JSON", "")
    config = json.loads(config_json)
    return Path(
        "organizations",
        config["organization_id"],
        "workspaces",
        config["workspace_id"],
        "projects",
        config["project_id"],
        "jobs",
        config["job_id"],
    )


def _get_shard_files_dir() -> Path:
    """Get shard files directory path from environment variables."""
    return Path(os.environ["SHARD_FILES_DIR"])


class AsyncCaller:
    """Helper class to execute a function as non-blocking.

    This class is used for live metric logging.
    """

    STOP_SIGN: ClassVar[str] = "__STOP__"
    instance: ClassVar[AsyncCaller | None] = None

    def __new__(cls):
        if cls.instance is None:
            cls.instance = super().__new__(cls)

        return cls.instance

    def start(self) -> None:
        self.queue: Queue = Queue()
        self.thread: Thread = Thread(target=self.loop)
        self.thread.start()

    def loop(self) -> None:
        while (item := self.queue.get()) != self.STOP_SIGN:
            item()

    def close(self) -> None:
        self.queue.put(self.STOP_SIGN)
        self.thread.join(timeout=TIMEOUT)

    def put(self, func: Callable, *args, **kwargs) -> None:
        self.queue.put(partial(func, *args, **kwargs))

    @staticmethod
    def async_wrap(func):  # noqa: ANN001, ANN205
        @wraps(func)
        def wrapper(*args, **kwargs):
            async_caller = AsyncCaller()
            if (thread := getattr(async_caller, "thread", None)) is None:
                raise RuntimeError("You should call AsyncCaller().start() first.")

            thread: Thread

            if not thread.is_alive():
                raise RuntimeError("AsyncCaller's thread is not alive.")

            async_caller.put(func, *args, **kwargs)

        return wrapper


@logging_elapsed_time(logger=logger, log_level=logging.INFO)
def download_shard_files() -> Path:
    """Download shard files."""
    pattern = re.compile("datum-(\d+)-of-(\d+).arrow")

    client = S3ClientSingleton.instance()
    shard_file_names = []
    for obj in client.list_files(
        bucket_name=_get_bucket_name(), relative_path=_get_object_name_base() / "inputs", recursive=True
    ):
        if not obj.is_dir and pattern.findall(obj.object_name):
            shard_file_names += [os.path.basename(obj.object_name)]

    for shard_file_name in tqdm(shard_file_names, desc="Downloading shard files"):
        client.download_file(
            bucket_name=_get_bucket_name(),
            relative_path=_get_object_name_base() / "inputs" / shard_file_name,
            file_path=_get_shard_files_dir() / shard_file_name,
        )

    return _get_shard_files_dir()


@logging_elapsed_time(logger=logger, log_level=logging.INFO)
def download_config_file() -> Path:
    """Download the configuration file."""
    file_path = _get_shard_files_dir() / "config.yaml"
    S3ClientSingleton.instance().download_file(
        bucket_name=_get_bucket_name(),
        relative_path=_get_object_name_base() / "inputs/config.yaml",
        file_path=file_path,
    )
    return file_path


@AsyncCaller.async_wrap
@logging_elapsed_time(logger=logger, log_level=logging.INFO)
def save_checkpoint(
    model_weights_reader: io.BufferedReader,
    force_non_xai: bool = False,
) -> None:
    """Save the trained base model weight binary file (BASE_FRAMEWORK) asynchronously."""
    save_checkpoint_sync(model_weights_reader=model_weights_reader, force_non_xai=force_non_xai)


@logging_elapsed_time(logger=logger, log_level=logging.INFO)
def save_checkpoint_sync(
    model_weights_reader: io.BufferedReader,
    force_non_xai: bool = False,
) -> None:
    """Save the trained base model weight binary file (BASE_FRAMEWORK)."""
    filename = BASE_MODEL_FILENAME if not force_non_xai else BASE_MODEL_FILENAME.replace("xai", "non-xai")
    with TemporaryDirectory() as tmpdir:
        local_dir_path = Path(tmpdir)
        local_file_path = local_dir_path / filename

        with local_file_path.open("wb") as fp:
            fp.write(model_weights_reader.read())

        S3ClientSingleton.instance().upload_file_from_local_disk(
            bucket_name=_get_bucket_name(),
            relative_path=_get_object_name_base() / "outputs/models" / filename,
            local_file_path=local_file_path,
        )


def upload_error_log(exception: Exception) -> None:
    """Log exception and traceback."""
    error_dict = {
        "exc_type": exception.__class__.__name__,
        "message": str(exception),
        "traceback": traceback.format_exc(),
    }
    S3ClientSingleton.instance().upload_file_from_bytes(
        bucket_name=_get_bucket_name(),
        relative_path=_get_object_name_base() / "outputs/logs/error.json",
        input_bytes=json.dumps(error_dict).encode("utf-8"),
        overwrite=True,
    )


def upload_full_log(full_log_text: str) -> None:
    """Log full OTX process."""
    S3ClientSingleton.instance().upload_file_from_bytes(
        bucket_name=_get_bucket_name(),
        relative_path=_get_object_name_base() / "outputs/logs/otx-full.log",
        input_bytes=full_log_text.encode("utf-8"),
        overwrite=True,
    )


@logging_elapsed_time(logger=logger, log_level=logging.INFO)
def upload_model_artifact(
    src_filepath: Path,
    dst_filepath: Path,
) -> None:
    """Upload model artifact."""
    S3ClientSingleton.instance().upload_file_from_local_disk(
        bucket_name=_get_bucket_name(),
        relative_path=_get_object_name_base() / dst_filepath,
        local_file_path=src_filepath,
    )


@logging_elapsed_time(logger=logger, log_level=logging.INFO)
def download_model_artifact(
    src_path: Path,
    dst_dir_path: Path,
    use_presigned_url: bool = True,
) -> Path:
    """Download model artifact."""
    if not dst_dir_path.is_dir():
        msg = f"dst_dir_path={dst_dir_path} should be a directory."
        raise ValueError(msg)

    file_path = dst_dir_path / src_path.name
    if use_presigned_url:
        presigned_url = S3ClientSingleton.instance().get_presigned_url(
            bucket_name=_get_bucket_name(), relative_path=_get_object_name_base() / src_path
        )
        with open(file_path, "wb") as fp:
            try:
                response = requests.get(presigned_url, timeout=300, stream=False)
                response.raise_for_status()
                fp.write(response.content)
            finally:
                response.close()
    else:
        S3ClientSingleton.instance().download_file(
            bucket_name=_get_bucket_name(),
            relative_path=_get_object_name_base() / src_path,
            file_path=file_path,
        )

    logger.info("Downloaded model artifact to %s", file_path)
    return Path(file_path)


def save_trained_model_weights(
    best_checkpoint: Path,
    force_non_xai: bool = False,
) -> None:
    """Save model trained weights (PyTorch checkpoint)."""
    filename = BASE_MODEL_FILENAME if not force_non_xai else BASE_MODEL_FILENAME.replace("xai", "non-xai")

    upload_model_artifact(
        src_filepath=best_checkpoint,
        dst_filepath=Path("outputs/models") / filename,
    )


def save_exported_model(export_dir: Path, export_param: ExportParameter) -> None:
    """Utility function to save exported format according to `ExportParameter`."""
    if export_param.export_format == ExportFormat.OPENVINO:
        target_names = (
            ["optimized_model.bin", "optimized_model.xml"]
            if export_param.precision == PrecisionType.INT8
            else ["exported_model.bin", "exported_model.xml"]
        )

        for src_filename, dst_filename in zip(
            target_names,
            export_param.to_artifact_fnames(),
        ):
            src_filepath = export_dir / src_filename
            upload_model_artifact(
                src_filepath=src_filepath,
                dst_filepath=Path("outputs/models") / dst_filename,
            )
            os.remove(src_filepath)

        return

    if export_param.export_format == ExportFormat.ONNX:
        for src_filename, dst_filename in zip(
            ["exported_model.onnx"],
            export_param.to_artifact_fnames(),
        ):
            upload_model_artifact(
                src_filepath=export_dir / src_filename,
                dst_filepath=Path("outputs/models") / dst_filename,
            )

        return

    raise ValueError(export_param)


def load_trained_model_weights(
    work_dir: Path,
    optimize: bool = False,
) -> Path | None:
    """
    Load the trained model weights and save them to the specified working directory.

    Args:
        work_dir (Path): The directory where the model weights will be saved.
        optimize (bool, optional): A flag indicating whether to load optimized model weights. Defaults to False.

    Returns:
        Path | None: The path to the saved model weights file if successful, otherwise None.
                     For the optimization path, any returned path indicates that the weights have been loaded
                     successfully.
                     For the training path, there is always a single PyTorch-based path.
    """

    src_dir = _get_object_name_base() / "inputs"
    src_fnames = {"weights": "model.pth"}
    if optimize:
        src_fnames["weights"] = "openvino.xml"
        src_fnames["binaries"] = "openvino.bin"

    logger.info(f"Listing artifacts under relative path: {src_dir}")
    file_info_set = []
    for obj_info in S3ClientSingleton.instance().list_files(bucket_name=_get_bucket_name(), relative_path=src_dir):
        file_info_set += [os.path.basename(obj_info.object_name)]

    logger.info("Received file_info_set=%s", file_info_set)

    if not all(src_fname in file_info_set for src_fname in src_fnames.values()):
        logger.info("Found no model checkpoint. Starting from scratch.")
        return None

    logger.info("Found model checkpoint: %s. Downloading the checkpoint.", src_fnames)
    downloaded = {}
    for key, src_fname in src_fnames.items():
        downloaded[key] = download_model_artifact(
            src_path=Path("inputs") / src_fname,
            dst_dir_path=work_dir,
            use_presigned_url=False,
        )

    return downloaded["weights"]
