# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import os
from pathlib import Path
from unittest.mock import patch

import pytest
from optimize import optimize
from otx.backend.native.models.base import DataInputParams
from otx.models import VisionTransformer
from otx.types.export import OTXExportFormatType
from otx.types.label import LabelInfo
from utils import OTXConfig


@pytest.fixture()
def fxt_config(fxt_dir_assets):
    config_file_path = fxt_dir_assets / "pot_config.yaml"
    return OTXConfig.from_yaml_file(config_file_path)


@pytest.fixture()
def fxt_openvino_model(tmpdir):
    model = VisionTransformer(
        label_info=LabelInfo.from_num_classes(3),
        task="multi_class",
        data_input_params=DataInputParams(
            input_size=[224, 224], mean=[123.675, 116.28, 103.53], std=[58.395, 57.12, 57.375]
        ),
    )

    export_dir = Path(tmpdir)
    checkpoint_path = model.export(
        output_dir=export_dir,
        base_name="openvino",
        export_format=OTXExportFormatType.OPENVINO,
        to_exportable_code=False,
    )

    return checkpoint_path


# TODO (vinnamki): Remove this fixture after fixing
# CVS-142373
@pytest.fixture()
def fxt_exportable_code_side_effect(tmpdir):
    def side_effect(*args, **kwargs):
        model = VisionTransformer(
            label_info=LabelInfo.from_num_classes(3),
            task="multi_class",
            data_input_params=DataInputParams(
                input_size=[224, 224], mean=[123.675, 116.28, 103.53], std=[58.395, 57.12, 57.375]
            ),
        )

        export_dir = Path(tmpdir) / "export"
        checkpoint_path = model.export(
            output_dir=export_dir,
            base_name="exported_model",
            export_format=OTXExportFormatType.OPENVINO,
            to_exportable_code=True,
        )

        return checkpoint_path

    return side_effect


@patch("otx_io.upload_model_artifact")
@patch("otx.engine.engine.Engine.export")
@patch("optimize.load_trained_model_weights")
def test_optimize(
    mock_load_trained_model_weights,
    mock_engine_export,
    mock_upload_model_artifact,
    fxt_config,
    fxt_dir_assets,
    fxt_exportable_code_side_effect,
    fxt_openvino_model,
    tmpdir,
):
    # Arrange
    mock_load_trained_model_weights.return_value = fxt_openvino_model
    mock_engine_export.side_effect = fxt_exportable_code_side_effect

    # Act
    optimize(
        config=fxt_config,
        dataset_dir=fxt_dir_assets,
        work_dir=Path(tmpdir),
    )

    # Assert
    logged_local_paths = [call_args.kwargs["dst_filepath"] for call_args in mock_upload_model_artifact.call_args_list]
    logged_local_names = {os.path.basename(path) for path in logged_local_paths}

    assert logged_local_names == {
        # OPENVINO INT8
        "model_int8-pot_non-xai.xml",
        "model_int8-pot_non-xai.bin",
    }
