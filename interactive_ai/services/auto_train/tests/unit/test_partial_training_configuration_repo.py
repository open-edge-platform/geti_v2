# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from geti_configuration_tools.training_configuration import NullTrainingConfiguration

from repos.partial_training_configuration_repo import PartialTrainingConfigurationRepo

from geti_types import ID


class TestTrainingConfigurationRepo:
    def test_get_task_only_configuration(
        self, request, fxt_empty_project, fxt_training_configuration_task_level
    ) -> None:
        # Arrange
        repo = PartialTrainingConfigurationRepo(fxt_empty_project.identifier)
        request.addfinalizer(lambda: repo.delete_all())

        # Save the configuration to the repository
        repo.save(fxt_training_configuration_task_level)

        # Act
        retrieved_config = repo.get_task_only_configuration(fxt_training_configuration_task_level.task_id)

        # Assert
        assert retrieved_config.id_ == fxt_training_configuration_task_level.id_
        assert retrieved_config.task_id == fxt_training_configuration_task_level.task_id
        assert retrieved_config.model_dump() == fxt_training_configuration_task_level.model_dump()
        filtering_parameters = retrieved_config.global_parameters.dataset_preparation.filtering
        assert filtering_parameters.min_annotation_pixels.enable is True
        assert filtering_parameters.min_annotation_pixels.min_annotation_pixels == 256
        assert filtering_parameters.max_annotation_objects.enable is True
        assert filtering_parameters.max_annotation_objects.max_annotation_objects == 100

        # Test with non-existent task ID
        non_existent_task_id = ID("non_existent_task_id")
        null_config = repo.get_task_only_configuration(non_existent_task_id)
        assert isinstance(null_config, NullTrainingConfiguration)

    def test_get_by_model_manifest_id(
        self, request, fxt_empty_project, fxt_training_configuration_model_manifest_level
    ) -> None:
        # Arrange
        repo = PartialTrainingConfigurationRepo(fxt_empty_project.identifier)
        request.addfinalizer(lambda: repo.delete_all())

        repo.save(fxt_training_configuration_model_manifest_level)

        # Act
        retrieved_config = repo.get_by_model_manifest_id(
            fxt_training_configuration_model_manifest_level.model_manifest_id
        )

        # Assert
        assert retrieved_config.id_ == fxt_training_configuration_model_manifest_level.id_
        assert retrieved_config.model_manifest_id == fxt_training_configuration_model_manifest_level.model_manifest_id
        assert retrieved_config.model_dump() == fxt_training_configuration_model_manifest_level.model_dump()
        filtering_parameters = retrieved_config.global_parameters.dataset_preparation.filtering
        assert filtering_parameters.min_annotation_pixels.enable is True
        assert filtering_parameters.min_annotation_pixels.min_annotation_pixels == 512
        assert filtering_parameters.max_annotation_objects is None

        # Test with non-existent model manifest ID
        non_existent_manifest_id = "non-existent-manifest-id"
        null_config = repo.get_by_model_manifest_id(non_existent_manifest_id)
        assert isinstance(null_config, NullTrainingConfiguration)

    def test_get_global_parameters(
        self,
        request,
        fxt_empty_project,
        fxt_training_configuration_task_level,
        fxt_training_configuration_model_manifest_level,
    ) -> None:
        # Arrange
        repo = PartialTrainingConfigurationRepo(fxt_empty_project.identifier)
        request.addfinalizer(lambda: repo.delete_all())

        repo.save(fxt_training_configuration_task_level)
        repo.save(fxt_training_configuration_model_manifest_level)

        # Act
        retrieved_config = repo.get_global_parameters(
            task_id=fxt_training_configuration_task_level.task_id,
            model_manifest_id=fxt_training_configuration_model_manifest_level.model_manifest_id,
        )

        # Assert
        filtering_parameters = retrieved_config.dataset_preparation.filtering
        assert filtering_parameters.min_annotation_pixels.enable is True
        assert filtering_parameters.min_annotation_pixels.min_annotation_pixels == 512
        assert filtering_parameters.max_annotation_objects.enable is True
        assert filtering_parameters.max_annotation_objects.max_annotation_objects == 100
