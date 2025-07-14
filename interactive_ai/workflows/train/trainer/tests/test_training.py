# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import os
from pathlib import Path
from unittest.mock import patch

import pytest
from lightning import Trainer
from otx.algo.classification.vit import VisionTransformerForMulticlassCls
from otx.core.types.label import LabelInfo
from scripts.train import train
from scripts.utils import OTXConfig


@pytest.fixture()
def fxt_config(fxt_dir_assets):
    config_file_path = fxt_dir_assets / "training_config.json"
    return OTXConfig.from_json_file(config_file_path)


@pytest.fixture(params=[True, False], ids=["has_ckpt", "no_ckpt"])
def fxt_checkpoint(request, tmpdir, monkeypatch: pytest.MonkeyPatch):
    if not request.param:
        return None

    model = VisionTransformerForMulticlassCls(LabelInfo.from_num_classes(3))
    trainer = Trainer(max_steps=0)

    monkeypatch.setattr(trainer.strategy, "_lightning_module", model)
    monkeypatch.setattr(model, "_trainer", trainer)

    checkpoint_path = Path(tmpdir) / "checkpoint.ckpt"
    trainer.save_checkpoint(checkpoint_path)

    return checkpoint_path


@patch("metrics.upload_model_artifact")
@patch("otx_io.upload_model_artifact")
@patch("scripts.train.load_trained_model_weights")
def test_train(
    mock_load_trained_model_weights,
    mock_upload_model_artifact,
    mock_metrics_upload_model_artifact,
    fxt_config,
    fxt_dir_assets,
    fxt_checkpoint,
    tmpdir,
):
    # Arrange
    mock_load_trained_model_weights.return_value = fxt_checkpoint

    # Act
    train(
        config=fxt_config,
        dataset_dir=fxt_dir_assets,
        work_dir=Path(tmpdir),
        resume=False,
    )

    # Assert
    logged_local_paths = [call_args.kwargs["dst_filepath"] for call_args in mock_upload_model_artifact.call_args_list]
    logged_local_names = {os.path.basename(path) for path in logged_local_paths}

    assert logged_local_names == {
        #  BASE FRAMEWORK FP32
        "model_fp32_xai.pth",
        # OPENVINO FP32
        "model_fp32_xai.xml",
        "model_fp32_xai.bin",
        "model_fp32_non-xai.xml",
        "model_fp32_non-xai.bin",
        # OPENVINO FP16
        "model_fp16_non-xai.xml",
        "model_fp16_non-xai.bin",
        # ONNX FP32
        "model_fp32_non-xai.onnx",
        # Exportable codes
        "exportable-code_fp32_xai.whl",
        "exportable-code_fp32_non-xai.whl",
        "exportable-code_fp16_non-xai.whl",
    }
    mock_metrics_upload_model_artifact.assert_called_once_with(
        src_filepath=Path(tmpdir) / "metrics.json", dst_filepath=Path("live_metrics/metrics.json")
    )
