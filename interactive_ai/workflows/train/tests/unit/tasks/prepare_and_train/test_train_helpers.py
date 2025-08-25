# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
"""This module tests commands to create task train dataset"""

import json
from unittest.mock import MagicMock, patch

import pytest
from geti_supported_models import SupportedModels
from geti_supported_models.model_manifest import Capabilities
from geti_types import ID
from iai_core.entities.model import ModelPrecision, ModelStatus
from jobs_common.features.feature_flag_provider import FeatureFlag
from jobs_common_extras.experiments.adapters.ml_artifacts import MLArtifactsAdapter

from job.tasks.prepare_and_train.train_helpers import finalize_train, prepare_train


class TestTrainHelpers:
    @pytest.mark.parametrize(
        "feature_flag_setting", [pytest.param(True, id="fp16-enabled"), pytest.param(False, id="fp16-disabled")]
    )
    @pytest.mark.parametrize("has_xai", [True, False])
    @patch("job.tasks.prepare_and_train.train_helpers.MLArtifactsAdapter")
    @patch("job.tasks.prepare_and_train.train_helpers.ModelRepo")
    def test_prepare_train(
        self,
        mock_model_repo,
        mock_ml_artifacts_adapter,
        has_xai,
        feature_flag_setting,
        mock_train_data,
        fxt_dataset_with_images,
        monkeypatch,
    ) -> None:
        # Arrange
        monkeypatch.setenv(FeatureFlag.FEATURE_FLAG_FP16_INFERENCE.name, str(feature_flag_setting).lower())
        mock_model_repo.generate_id.side_effect = [ID(str(i)) for i in range(5)]
        dummy_config = {"dummy_key": "dummy_value"}
        mock_train_data.training_configuration_json = json.dumps(dummy_config)
        mock_model_manifest = MagicMock()
        mock_model_manifest.capabilities = Capabilities(xai=has_xai)

        # Act
        with patch.object(SupportedModels, "get_model_manifest_by_id", return_value=mock_model_manifest):
            train_output_models = prepare_train(
                train_data=mock_train_data,
                dataset=fxt_dataset_with_images,
            )
            output_model_ids = train_output_models.to_train_output_model_ids()

        # Assert
        assert output_model_ids.base == "0"
        assert output_model_ids.mo_with_xai == "1"
        assert (
            ModelPrecision.FP16 if feature_flag_setting else ModelPrecision.FP32
        ) in train_output_models.mo_with_xai.precision
        if has_xai:
            assert output_model_ids.mo_fp32_without_xai == "2"
            assert output_model_ids.mo_fp16_without_xai == "3"
            assert output_model_ids.onnx == "4"
        else:
            if feature_flag_setting:  # mo_with_xai uses FP16
                assert output_model_ids.mo_fp32_without_xai == "2"
                assert output_model_ids.mo_fp16_without_xai is None
            else:  # mo_with_xai uses FP32
                assert output_model_ids.mo_fp32_without_xai is None
                assert output_model_ids.mo_fp16_without_xai == "2"
            assert output_model_ids.onnx == "3"

        mock_ml_artifacts_adapter.return_value.push_placeholders.assert_called_once()
        mock_ml_artifacts_adapter.return_value.push_metadata.assert_called_once()
        mock_ml_artifacts_adapter.return_value.push_input_configuration.assert_called_once()
        mock_ml_artifacts_adapter.return_value.push_input_model.assert_called_once()

    @patch("job.tasks.prepare_and_train.train_helpers.TrainOutputModels.from_train_output_model_ids")
    @patch("jobs_common_extras.experiments.utils.train_output_models.ModelRepo")
    @patch("jobs_common_extras.experiments.utils.train_output_models.ModelService")
    def test_finalize_train(
        self,
        mock_model_service,
        mock_model_repo,
        mock_from_train_output_model_ids,
        mock_train_data,
        fxt_train_output_model_ids,
        fxt_train_output_models,
        fxt_configurable_parameters_1,
    ) -> None:
        # Arrange
        mock_from_train_output_model_ids.return_value = fxt_train_output_models
        mock_ml_artifacts_adapter = MagicMock(spec=MLArtifactsAdapter)
        mock_ml_artifacts_adapter.pull_output_configuration.return_value = fxt_configurable_parameters_1

        # Act
        with patch.object(
            MLArtifactsAdapter,
            "__new__",
            return_value=mock_ml_artifacts_adapter,
        ):
            finalize_train(
                train_data=mock_train_data,
                train_output_model_ids=fxt_train_output_model_ids,
            )

        # Assert
        mock_ml_artifacts_adapter.clean.assert_called_once()
        mock_ml_artifacts_adapter.update_output_models.assert_called_once()
        mock_ml_artifacts_adapter.pull_metrics.assert_called_once()

        for model, call_args in zip(
            fxt_train_output_models.get_all_models(),
            mock_model_repo.return_value.update_model_status.call_args_list,
        ):
            assert call_args.kwargs["model"] == model
            assert call_args.kwargs["model_status"] == ModelStatus.TRAINED_NO_STATS

        mock_ml_artifacts_adapter.pull_output_configuration.assert_called_once()
