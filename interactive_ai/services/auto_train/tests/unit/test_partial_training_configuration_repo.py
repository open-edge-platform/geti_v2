# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from unittest.mock import patch

from repos.partial_training_configuration_repo import PartialTrainingConfigurationRepo


class TestTrainingConfigurationRepo:
    def test_get_global_parameters(
        self,
        fxt_empty_project,
        fxt_training_configuration_task_level,
        fxt_training_configuration_model_manifest_level,
    ) -> None:
        # Arrange
        repo = PartialTrainingConfigurationRepo(fxt_empty_project.identifier)

        # Act
        with (
            patch.object(
                PartialTrainingConfigurationRepo,
                "get_task_only_configuration",
                return_value=fxt_training_configuration_task_level,
            ) as mock_get_task_only_configuration,
            patch.object(
                PartialTrainingConfigurationRepo,
                "get_by_model_manifest_id",
                return_value=fxt_training_configuration_model_manifest_level,
            ) as mock_get_by_model_manifest_id,
        ):
            retrieved_config = repo.get_global_parameters(
                task_id=fxt_training_configuration_task_level.task_id,
                model_manifest_id=fxt_training_configuration_model_manifest_level.model_manifest_id,
            )

        # Assert
        mock_get_task_only_configuration.assert_called_once_with(task_id=fxt_training_configuration_task_level.task_id)
        mock_get_by_model_manifest_id.assert_called_once_with(
            model_manifest_id=fxt_training_configuration_model_manifest_level.model_manifest_id
        )
        filtering_parameters = retrieved_config.dataset_preparation.filtering
        assert filtering_parameters.min_annotation_pixels.enable is True
        assert filtering_parameters.min_annotation_pixels.min_annotation_pixels == 512
        assert filtering_parameters.max_annotation_objects.enable is True
        assert filtering_parameters.max_annotation_objects.max_annotation_objects == 100
