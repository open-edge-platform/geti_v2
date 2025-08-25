# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
"""
ConfigurationManager tests
"""

from unittest.mock import MagicMock, call, patch

import pytest

from configuration import ConfigurableComponentRegister
from configuration.configuration_manager import ConfigurationManager
from features.feature_flag import FeatureFlag
from service.configuration_service import ConfigurationService
from storage.repos.project_configuration_repo import ProjectConfigurationRepo

import iai_core.configuration.helper as otx_config_helper
from geti_fastapi_tools.exceptions import ModelNotFoundException
from geti_types import ID
from iai_core.configuration.elements.component_parameters import ComponentParameters, ComponentType
from iai_core.entities.model import NullModel
from iai_core.entities.model_storage import ModelStorage
from iai_core.repos import ConfigurableParametersRepo, ModelRepo, ModelStorageRepo, ProjectRepo, TaskNodeRepo
from iai_core.services.model_service import ModelService

WORKSPACE_ID = ID("workspace_id")


class TestConfigurationManager:
    def test_get_configuration_for_model(
        self,
        fxt_mongo_id,
        fxt_project_with_detection_task,
        fxt_model,
        fxt_model_storage_detection,
    ):
        detection_task = fxt_project_with_detection_task.tasks[-1]

        with (
            patch.object(ModelRepo, "get_by_id", return_value=fxt_model),
            patch.object(
                ConfigurationManager,
                "_ConfigurationManager__get_model_storages_by_task_id",
                return_value=[fxt_model_storage_detection],
            ),
            patch.object(ProjectRepo, "get_by_id", return_value=fxt_project_with_detection_task),
        ):
            (
                model_configuration,
                model_storage_id,
            ) = ConfigurationManager().get_configuration_for_model(
                workspace_id=fxt_project_with_detection_task.workspace_id,
                project_id=fxt_project_with_detection_task.id_,
                task_id=detection_task.id_,
                model_id=fxt_mongo_id(),
            )

        assert model_configuration == fxt_model.configuration.configurable_parameters
        assert model_storage_id == fxt_model_storage_detection.id_

    def test_get_configuration_for_algorithm_uninitialized_model_storage(
        self,
        fxt_project_with_detection_task,
        fxt_default_model_hyper_parameters,
        fxt_model_template_detection,
    ):
        # Arrange
        detection_task = fxt_project_with_detection_task.tasks[-1]
        algorithm_name = "test_model_template_id"

        # Set a non-default value for one of the parameters to make sure we're not
        # just returning the defaults, upon comparison later on
        fxt_default_model_hyper_parameters.learning_parameters.batch_size = 200
        fxt_model_template_detection.hyper_parameters.manually_set_data_and_validate(
            otx_config_helper.convert(
                fxt_default_model_hyper_parameters.data,
                target=dict,
                enum_to_str=True,
                id_to_str=True,
            )
        )
        model_storage = ModelStorage(
            id_=ModelStorageRepo.generate_id(),
            project_id=fxt_project_with_detection_task.id_,
            task_node_id=detection_task.id_,
            model_template=fxt_model_template_detection,
        )

        # Act
        with (
            patch.object(ProjectRepo, "get_by_id", return_value=fxt_project_with_detection_task),
            patch.object(ConfigurableParametersRepo, "save", return_value=None) as mock_save_hyper_parameters,
            patch.object(
                ModelService,
                "get_or_create_model_storage",
                return_value=model_storage,
            ) as mock_get_model_storage,
        ):
            hyper_parameters = ConfigurationManager().get_configuration_for_algorithm(
                workspace_id=fxt_project_with_detection_task.workspace_id,
                project_id=fxt_project_with_detection_task.id_,
                task_id=detection_task.id_,
                algorithm_name=algorithm_name,
            )

        # Assert
        mock_save_hyper_parameters.assert_called_once_with(hyper_parameters)
        mock_get_model_storage.assert_called_once_with(
            task_node=detection_task,
            model_manifest_id=algorithm_name,
            project_identifier=fxt_project_with_detection_task.identifier,
        )

        # Compare hyper parameters, ID's will differ but that is expected
        assert fxt_default_model_hyper_parameters.id_ != ID()
        hyper_parameters.id_ = fxt_default_model_hyper_parameters.id_
        assert hyper_parameters.data == fxt_default_model_hyper_parameters.data

    def test_get_configuration_for_algorithm_initialized_model_storage(
        self,
        fxt_project_with_detection_task,
        fxt_default_model_hyper_parameters,
        fxt_model_template_detection,
        fxt_model_storage_detection,
    ):
        # Arrange
        detection_task = fxt_project_with_detection_task.tasks[-1]
        algorithm_name = fxt_model_template_detection.model_manifest_id

        # Set a non-default value for one of the parameters to make sure we're not
        # just returning the defaults, upon comparison later on
        fxt_default_model_hyper_parameters.learning_parameters.batch_size = 200
        fxt_model_template_detection.hyper_parameters.manually_set_data_and_validate(
            otx_config_helper.convert(
                fxt_default_model_hyper_parameters.data,
                target=dict,
                enum_to_str=True,
                id_to_str=True,
            )
        )
        fxt_model_storage_detection._model_template = fxt_model_template_detection

        # Act
        with (
            patch.object(ProjectRepo, "get_by_id", return_value=fxt_project_with_detection_task),
            patch.object(
                ModelStorageRepo,
                "get_by_task_node_id",
                return_value=[fxt_model_storage_detection],
            ) as mock_get_model_storages,
            patch.object(
                ConfigurableParametersRepo,
                "get_or_create_hyper_parameters",
                return_value=fxt_default_model_hyper_parameters,
            ) as mock_get_hyper_parameters,
        ):
            hyper_parameters = ConfigurationManager().get_configuration_for_algorithm(
                workspace_id=fxt_project_with_detection_task.workspace_id,
                project_id=fxt_project_with_detection_task.id_,
                task_id=detection_task.id_,
                algorithm_name=algorithm_name,
            )

        # Assert
        assert hyper_parameters == fxt_default_model_hyper_parameters

        mock_get_model_storages.assert_called_once_with(task_node_id=detection_task.id_)
        mock_get_hyper_parameters.assert_called_once_with(model_storage=fxt_model_storage_detection)

    def test_get_configuration_for_model_not_found(self, fxt_mongo_id, fxt_project_with_detection_task, fxt_model):
        detection_task = fxt_project_with_detection_task.tasks[-1]

        with (
            pytest.raises(ModelNotFoundException),
            patch.object(ProjectRepo, "get_by_id", return_value=fxt_project_with_detection_task),
            patch.object(ModelRepo, "get_by_id", return_value=NullModel()),
            patch.object(ModelStorageRepo, "get_by_task_node_id", return_value=[]),
        ):
            ConfigurationManager().get_configuration_for_model(
                workspace_id=fxt_project_with_detection_task.workspace_id,
                project_id=fxt_project_with_detection_task.id_,
                task_id=detection_task.id_,
                model_id=fxt_mongo_id(),
            )

    def test_get_global_configuration(
        self,
        fxt_mongo_id,
        fxt_project_with_detection_task,
        fxt_configuration_2,
    ):
        global_components = [
            cmp for cmp in ComponentType if not cmp.metadata.per_task and cmp != ComponentType.NULL_COMPONENT
        ]

        with (
            patch.object(
                ConfigurableParametersRepo,
                "get_or_create_component_parameters",
                return_value=fxt_configuration_2,
            ) as mock_get_or_create_parameters,
            patch.object(ProjectRepo, "get_by_id", return_value=fxt_project_with_detection_task),
        ):
            global_configuration = ConfigurationManager().get_global_configuration(
                project_id=fxt_project_with_detection_task.id_,
                workspace_id=WORKSPACE_ID,
            )

            last_configuration_type = ConfigurableComponentRegister[
                global_components[-1].name
            ].value.get_configuration_type()
            mock_get_or_create_parameters.assert_called_with(
                data_instance_of=last_configuration_type,
                component=global_components[-1],
                task_id=None,
            )

        assert len(global_configuration) == len(global_components)
        for configuration in global_configuration:
            assert isinstance(configuration, ComponentParameters)
            assert configuration.task_id == ID()

    def test_get_configuration_for_task(
        self,
        fxt_mongo_id,
        fxt_project_with_detection_task,
        fxt_configuration_1,
        fxt_configuration_2,
        fxt_model_storage_detection,
    ):
        per_task_components = [cmp for cmp in ComponentType if cmp.metadata.per_task]
        task = fxt_project_with_detection_task.get_trainable_task_nodes()[-1]

        with (
            patch.object(
                ConfigurationManager,
                "_ConfigurationManager__get_active_model_storage_by_project_and_task_id",
                return_value=fxt_model_storage_detection,
            ),
            patch.object(
                ConfigurableParametersRepo,
                "get_or_create_hyper_parameters",
                return_value=fxt_configuration_1,
            ) as mock_get_hypers,
            patch.object(
                ConfigurableParametersRepo,
                "get_or_create_component_parameters",
                return_value=fxt_configuration_2,
            ) as mock_get_or_create_component_params,
            patch.object(ProjectRepo, "get_by_id", return_value=fxt_project_with_detection_task),
        ):
            task_configuration = ConfigurationManager().get_active_configuration_for_task(
                task_id=task.id_,
                project_id=fxt_project_with_detection_task.id_,
                workspace_id=WORKSPACE_ID,
            )

            mock_get_hypers.assert_called_once_with(model_storage=fxt_model_storage_detection)
            last_configuration_register_data = ConfigurableComponentRegister[per_task_components[-1].name].value
            configuration_type = last_configuration_register_data.get_configuration_type(
                task_type=task.task_properties.task_type
            )
            mock_get_or_create_component_params.assert_called_with(
                data_instance_of=configuration_type,
                component=per_task_components[-1],
                task_id=task.id_,
            )
        assert len(task_configuration) == len(per_task_components) + 1

    def test_get_configuration_for_task_chain(
        self,
        fxt_mongo_id,
        fxt_project_with_detection_task,
        fxt_configuration_1,
        fxt_configuration_2,
        fxt_model_storage,
    ):
        per_task_components = [cmp for cmp in ComponentType if cmp.metadata.per_task]

        with (
            patch.object(
                ModelService,
                "get_active_model_storage",
                return_value=fxt_model_storage,
            ),
            patch.object(
                ConfigurableParametersRepo,
                "get_or_create_hyper_parameters",
                return_value=fxt_configuration_1,
            ) as mock_get_hypers,
            patch.object(
                ConfigurableParametersRepo,
                "get_or_create_component_parameters",
                return_value=fxt_configuration_2,
            ) as mock_get_or_create_component_params,
            patch.object(ProjectRepo, "get_by_id", return_value=fxt_project_with_detection_task),
        ):
            trainable_task = fxt_project_with_detection_task.get_trainable_task_nodes()[-1]

            task_chain_configuration = ConfigurationManager().get_configuration_for_task_chain(
                workspace_id=WORKSPACE_ID,
                project_id=fxt_project_with_detection_task.id_,
            )

            mock_get_hypers.assert_called_once()
            last_configuration_register_data = ConfigurableComponentRegister[per_task_components[-1].name].value
            configuration_type = last_configuration_register_data.get_configuration_type(
                task_type=trainable_task.task_properties.task_type
            )
            mock_get_or_create_component_params.assert_called_with(
                data_instance_of=configuration_type,
                component=per_task_components[-1],
                task_id=trainable_task.id_,
            )
            assert len(task_chain_configuration) == len(fxt_project_with_detection_task.get_trainable_task_nodes())
            assert task_chain_configuration[0]["task"] == trainable_task
            assert len(task_chain_configuration[0]["configurations"]) == len(per_task_components) + 1

    def test_get_global_configuration_with_feature_flag(self, fxt_enable_feature_flag_name) -> None:
        # Arrange
        project_id = ID("project_id")
        fxt_enable_feature_flag_name(FeatureFlag.FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS.name)
        dummy_config = MagicMock()

        # Act
        with patch.object(
            ConfigurationManager, "_get_from_new_configurations", return_value=(dummy_config, [])
        ) as mock_get_from_new_configurations:
            global_configuration = ConfigurationManager().get_global_configuration(
                project_id=project_id,
                workspace_id=WORKSPACE_ID,
            )

            # Assert
            mock_get_from_new_configurations.assert_called_once_with(workspace_id=WORKSPACE_ID, project_id=project_id)
            assert global_configuration == dummy_config

    def test_get_configuration_for_task_chain_with_feature_flag(self, fxt_enable_feature_flag_name) -> None:
        # Arrange
        project_id = ID("project_id")
        fxt_enable_feature_flag_name(FeatureFlag.FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS.name)
        dummy_config = MagicMock()

        # Act
        with patch.object(
            ConfigurationManager, "_get_from_new_configurations", return_value=(None, dummy_config)
        ) as mock_get_from_new_configurations:
            task_chain_config = ConfigurationManager().get_configuration_for_task_chain(
                project_id=project_id,
                workspace_id=WORKSPACE_ID,
            )

            # Assert
            mock_get_from_new_configurations.assert_called_once_with(workspace_id=WORKSPACE_ID, project_id=project_id)
            assert task_chain_config == dummy_config

    def test_get_from_new_configurations(
        self,
        fxt_project_identifier,
        fxt_project_configuration,
        fxt_training_configuration_task_level,
        fxt_enable_feature_flag_name,
    ):
        # Arrange
        fxt_enable_feature_flag_name(FeatureFlag.FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS.name)
        task_ids = [task_config.task_id for task_config in fxt_project_configuration.task_configs]
        fxt_training_configuration_task_level.task_id = task_ids[0]
        active_model_storages = [MagicMock(), MagicMock()]
        active_model_storages[0].model_template_id = "model_template_1"
        active_model_storages[1].model_template_id = "model_template_2"

        # Act
        with (
            patch.object(
                ProjectConfigurationRepo, "get_project_configuration", return_value=fxt_project_configuration
            ) as mock_get_project_config,
            patch.object(
                ConfigurationService,
                "get_full_training_configuration",
                side_effect=[fxt_training_configuration_task_level, fxt_training_configuration_task_level],
            ) as mock_get_full_training_config,
            patch.object(
                ConfigurationManager,
                "_ConfigurationManager__get_active_model_storage_by_project_and_task_id",
                side_effect=active_model_storages,
            ),
            patch.object(TaskNodeRepo, "get_trainable_task_ids", return_value=task_ids) as mock_get_trainable_task_ids,
        ):
            global_config, task_chain_config = ConfigurationManager._get_from_new_configurations(
                workspace_id=fxt_project_identifier.workspace_id,
                project_id=fxt_project_identifier.project_id,
            )

            # Assert
            mock_get_trainable_task_ids.assert_called_once()
            mock_get_project_config.assert_called()
            mock_get_full_training_config.assert_has_calls(
                [
                    call(
                        project_identifier=fxt_project_identifier,
                        task_id=task_id,
                        model_manifest_id=model_storage.model_template_id,
                    )
                    for task_id, model_storage in zip(task_ids, active_model_storages)
                ]
            )
            assert len(global_config) == 2
            assert len(task_chain_config) == 2

    def test_get_task_config_from_new_configurations(
        self,
        fxt_project_identifier,
        fxt_project_configuration,
        fxt_training_configuration_task_level,
        fxt_enable_feature_flag_name,
    ):
        # Arrange
        fxt_enable_feature_flag_name(FeatureFlag.FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS.name)
        task_id = fxt_project_configuration.task_configs[0].task_id
        fxt_training_configuration_task_level.task_id = task_id
        model_template_id = "test_model_template_id"

        # Act
        with (
            patch.object(
                ProjectConfigurationRepo, "get_project_configuration", return_value=fxt_project_configuration
            ) as mock_get_project_config,
            patch.object(
                ConfigurationService,
                "get_full_training_configuration",
                return_value=fxt_training_configuration_task_level,
            ) as mock_get_full_training_config,
        ):
            task_config = ConfigurationManager._get_task_config_from_new_configurations(
                project_identifier=fxt_project_identifier,
                task_id=task_id,
                model_template_id=model_template_id,
            )

            # Assert
            mock_get_project_config.assert_called_once()
            mock_get_full_training_config.assert_called_once_with(
                project_identifier=fxt_project_identifier,
                task_id=task_id,
                model_manifest_id=model_template_id,
            )
            assert len(task_config) == 5
            expected_learning_parameters = fxt_training_configuration_task_level.hyperparameters.training
            task_learning_params = task_config[0].learning_parameters
            assert task_learning_params.learning_rate == expected_learning_parameters.learning_rate
            assert task_learning_params.max_epochs == expected_learning_parameters.max_epochs
            assert task_learning_params.enable_early_stopping == expected_learning_parameters.early_stopping.enable

    def test_get_configuration_for_algorithm_with_feature_flag(
        self, fxt_enable_feature_flag_name, fxt_project_identifier
    ) -> None:
        # Arrange
        fxt_enable_feature_flag_name(FeatureFlag.FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS.name)
        dummy_config = MagicMock()
        model_template_id = "test_model_template_id"
        task_id = ID("test_task_id")

        # Act
        with patch.object(
            ConfigurationManager, "_get_task_config_from_new_configurations", return_value=[dummy_config]
        ) as mock_get_configurations:
            task_chain_config = ConfigurationManager().get_configuration_for_algorithm(
                workspace_id=fxt_project_identifier.workspace_id,
                project_id=fxt_project_identifier.project_id,
                algorithm_name=model_template_id,
                task_id=task_id,
            )

            # Assert
            mock_get_configurations.assert_called_once_with(
                project_identifier=fxt_project_identifier, task_id=task_id, model_template_id=model_template_id
            )
            assert task_chain_config == dummy_config

    def test_get_active_configuration_for_task_with_feature_flag(
        self, fxt_enable_feature_flag_name, fxt_project_identifier, fxt_model_storage
    ) -> None:
        # Arrange
        fxt_enable_feature_flag_name(FeatureFlag.FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS.name)
        dummy_config = MagicMock()
        task_id = ID("test_task_id")

        # Act
        with (
            patch.object(
                ConfigurationManager, "_get_task_config_from_new_configurations", return_value=dummy_config
            ) as mock_get_configurations,
            patch.object(
                ConfigurationManager,
                "_ConfigurationManager__get_active_model_storage_by_project_and_task_id",
                return_value=fxt_model_storage,
            ),
        ):
            task_chain_config = ConfigurationManager().get_active_configuration_for_task(
                workspace_id=fxt_project_identifier.workspace_id,
                project_id=fxt_project_identifier.project_id,
                task_id=task_id,
            )

            # Assert
            mock_get_configurations.assert_called_once_with(
                project_identifier=fxt_project_identifier,
                task_id=task_id,
                model_template_id=fxt_model_storage.model_template_id,
            )
            assert task_chain_config == dummy_config
