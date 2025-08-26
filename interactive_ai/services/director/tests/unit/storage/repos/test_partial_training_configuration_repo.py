# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from unittest.mock import patch

from geti_configuration_tools.training_configuration import (
    Filtering,
    GlobalDatasetPreparationParameters,
    GlobalParameters,
    MaxAnnotationObjects,
    MaxAnnotationPixels,
    MinAnnotationObjects,
    MinAnnotationPixels,
    NullTrainingConfiguration,
    SubsetSplit,
)

from storage.repos.partial_training_configuration_repo import PartialTrainingConfigurationRepo

from geti_types import ID
from iai_core.repos import TaskNodeRepo


class TestTrainingConfigurationRepo:
    def test_get_or_create_task_only_configuration(
        self, request, fxt_project_identifier, fxt_training_configuration_task_level, fxt_task
    ):
        # Arrange
        repo = PartialTrainingConfigurationRepo(fxt_project_identifier)
        request.addfinalizer(lambda: repo.delete_all())
        fxt_training_configuration_task_level.global_parameters.dataset_preparation.subset_split.dataset_size = 10

        # Save the configuration to the repository
        repo.save(fxt_training_configuration_task_level)

        # Act
        retrieved_config = repo.get_or_create_task_only_configuration(fxt_training_configuration_task_level.task_id)

        # Assert
        assert retrieved_config.id_ == fxt_training_configuration_task_level.id_
        assert retrieved_config.task_id == fxt_training_configuration_task_level.task_id
        assert retrieved_config.model_dump() == fxt_training_configuration_task_level.model_dump()
        # dataset_size field should not be saved
        assert retrieved_config.global_parameters.dataset_preparation.subset_split.dataset_size is None

        # Test with non-existent task ID
        non_existent_task_id = ID("non_existent_task_id")
        null_config = repo.get_or_create_task_only_configuration(non_existent_task_id)
        assert isinstance(null_config, NullTrainingConfiguration)

        # Test with existing task but no configuration
        with (
            patch.object(TaskNodeRepo, "exists", return_value=True) as mock_exists,
            patch.object(TaskNodeRepo, "get_by_id", return_value=fxt_task) as mock_get_by_id,
        ):
            default_config = repo.get_or_create_task_only_configuration(fxt_task.id_)
            assert not isinstance(default_config, NullTrainingConfiguration)
            mock_exists.assert_called_once_with(fxt_task.id_)
            mock_get_by_id.assert_called_once_with(fxt_task.id_)

    def test_get_by_model_manifest_id(self, request, fxt_project_identifier, fxt_training_configuration_task_level):
        # Arrange
        repo = PartialTrainingConfigurationRepo(fxt_project_identifier)
        request.addfinalizer(lambda: repo.delete_all())

        # Ensure configuration has a model_manifest_id
        fxt_training_configuration_task_level.model_manifest_id = "test-model-manifest-id"
        repo.save(fxt_training_configuration_task_level)

        # Act
        retrieved_config = repo.get_by_model_manifest_id(fxt_training_configuration_task_level.model_manifest_id)

        # Assert
        assert retrieved_config.id_ == fxt_training_configuration_task_level.id_
        assert retrieved_config.model_manifest_id == fxt_training_configuration_task_level.model_manifest_id
        assert retrieved_config.model_dump() == fxt_training_configuration_task_level.model_dump()

        # Test with non-existent model manifest ID
        non_existent_manifest_id = "non-existent-manifest-id"
        null_config = repo.get_by_model_manifest_id(non_existent_manifest_id)
        assert isinstance(null_config, NullTrainingConfiguration)

    def test_create_default_configuration(
        self, request, fxt_project_identifier, fxt_anomaly_task, fxt_classification_task, fxt_detection_task
    ) -> None:
        # Arrange
        repo = PartialTrainingConfigurationRepo(fxt_project_identifier)
        request.addfinalizer(lambda: repo.delete_all())
        expected_default_global_parameters_with_filtering = GlobalParameters(
            dataset_preparation=GlobalDatasetPreparationParameters(
                subset_split=SubsetSplit(),
                filtering=Filtering(
                    min_annotation_pixels=MinAnnotationPixels(),
                    max_annotation_pixels=MaxAnnotationPixels(),
                    min_annotation_objects=MinAnnotationObjects(),
                    max_annotation_objects=MaxAnnotationObjects(),
                ),
            )
        )
        expected_default_global_parameters_no_filtering = GlobalParameters(
            dataset_preparation=GlobalDatasetPreparationParameters(
                subset_split=SubsetSplit(),
            )
        )

        # Make sure no configurations exist
        repo.delete_all()

        # Prepare task IDs
        classification_task = fxt_classification_task
        detection_task = fxt_detection_task
        anomaly_task = fxt_anomaly_task
        tasks = [classification_task, detection_task, anomaly_task]

        # Act - Create default configuration
        repo.create_default_configuration(tasks)

        # Assert - Verify configurations were created for each task
        for task in tasks:
            created_config = repo.get_or_create_task_only_configuration(task.id_)

            # Verify the configuration was created
            assert not isinstance(created_config, NullTrainingConfiguration)
            assert created_config.task_id == str(task.id_)

            # Verify default global parameters were set correctly
            if task == detection_task:
                expected_params = expected_default_global_parameters_with_filtering.model_dump()
            else:
                expected_params = expected_default_global_parameters_no_filtering.model_dump()
            assert created_config.global_parameters.model_dump() == expected_params
            assert created_config.hyperparameters is None

        # Test idempotence - calling create_default_configuration again should not create duplicates
        # or overwrite existing configurations
        original_configs = {str(task.id_): repo.get_or_create_task_only_configuration(task.id_) for task in tasks}

        # Call create_default_configuration again
        repo.create_default_configuration(tasks)

        # Verify configurations remain the same
        for task in tasks:
            config_after = repo.get_or_create_task_only_configuration(task.id_)
            assert config_after.id_ == original_configs[str(task.id_)].id_
            assert config_after.model_dump() == original_configs[str(task.id_)].model_dump()
