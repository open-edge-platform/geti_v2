# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from typing import Any

from geti_configuration_tools.hyperparameters import (
    AugmentationParameters,
    DatasetPreparationParameters,
    EarlyStopping,
    EvaluationParameters,
    Hyperparameters,
    MaxDetectionPerImage,
    Tiling,
    TrainingHyperParameters,
)
from geti_configuration_tools.project_configuration import (
    PartialProjectConfiguration,
    PartialTaskConfig,
    ProjectConfiguration,
)
from geti_configuration_tools.training_configuration import PartialTrainingConfiguration, TrainingConfiguration

from active_learning.entities import ActiveLearningProjectConfig
from configuration import ConfigurableComponentRegister

from geti_types import ID, ProjectIdentifier
from iai_core.configuration.elements.component_parameters import ComponentParameters
from iai_core.configuration.elements.configurable_parameters import ConfigurableParameters
from iai_core.configuration.elements.dataset_manager_parameters import DatasetManagementConfig
from iai_core.configuration.elements.default_model_parameters import DefaultModelParameters
from iai_core.configuration.elements.hyper_parameters import HyperParameters
from iai_core.configuration.elements.parameter_group import ParameterGroup
from iai_core.configuration.enums import ComponentType
from iai_core.configuration.interfaces import IConfigurableParameterContainer
from iai_core.entities.model_template import TaskType
from iai_core.repos import ModelStorageRepo, TaskNodeRepo


class ConfigurationsBackwardCompatibility:
    """
    Class providing backward compatibility with legacy configuration endpoints.

    This class ensures that old endpoints continue to work while new ones are being developed,
    by converting between legacy and new configuration formats. It supports both directions:
    - Converting new configuration entities to legacy ones (backward_mapping)
    - Converting legacy configuration entities to new ones (forward_mapping)

    Warning:
        Not all legacy parameters are compatible with the new configuration system and vice versa.
        Using legacy configuration endpoints has the following limitations:
        - Users will not be able to access or set some new parameters (e.g., augmentations)
        - Setting deprecated parameters will have no effect
    """

    @classmethod
    def backward_mapping(
        cls,
        project_identifier: ProjectIdentifier,
        project_configuration: ProjectConfiguration,
        all_training_configurations: list[TrainingConfiguration],
    ) -> tuple[list[IConfigurableParameterContainer[Any]], list[dict[str, Any]]]:
        """
        Convert new configuration entities to legacy ones for backward compatibility.

        This method transforms the new configuration format (ProjectConfiguration and TrainingConfiguration)
        to the legacy format.

        Warning:
            Not all new parameters can be represented in the legacy format. When using this method:
            - Advanced features like certain augmentation parameters will not be accessible
            - Some settings may be ignored entirely

        :param project_identifier: Identifier for the project
        :param project_configuration: New format project configuration containing task-specific settings
        :param all_training_configurations: List of new format training configurations for all tasks
        :return: A tuple containing:
                - list[ConfigurableParameters]: Legacy global configuration parameters
                - list[dict[str, Any]]: Legacy task chain configurations with task and configurations
        """
        # Use the first task parameters for global parameters legacy configuration
        first_task_training_config = all_training_configurations[0]
        first_task_global_parameters = first_task_training_config.global_parameters
        filtering_parameters = first_task_global_parameters.dataset_preparation.filtering

        # active_learning_config is fully deprecated, use default values
        active_learning_config = ComponentParameters(
            id_=ID("000000000000000000000001"),
            workspace_id=project_identifier.workspace_id,
            project_id=project_identifier.project_id,
            component=ComponentType.PROJECT_ACTIVE_LEARNING,
            data=ActiveLearningProjectConfig(header="Active Learning"),
        )
        dataset_management_config = DatasetManagementConfig(header="Dataset Management")
        dataset_management_config.minimum_annotation_size = (
            filtering_parameters.min_annotation_pixels.min_annotation_pixels
            if filtering_parameters.min_annotation_pixels.enable
            else -1
        )
        dataset_management_config.maximum_number_of_annotations = (
            filtering_parameters.max_annotation_objects.max_annotation_objects
            if filtering_parameters.max_annotation_objects.enable
            else -1
        )
        dataset_config = ComponentParameters(
            id_=ID("000000000000000000000001"),
            workspace_id=project_identifier.workspace_id,
            project_id=project_identifier.project_id,
            component=ComponentType.PIPELINE_DATASET_MANAGER,
            data=dataset_management_config,
        )

        legacy_global_config: list[IConfigurableParameterContainer[Any]] = [
            active_learning_config,
            dataset_config,
        ]

        legacy_task_chain_configs = []
        for task_training_config in all_training_configurations:
            task_id = ID(task_training_config.task_id)
            task_node = TaskNodeRepo(project_identifier).get_by_id(task_id)
            project_task_config = project_configuration.get_task_config(task_training_config.task_id)

            legacy_hyper_parameters = DefaultModelParameters()
            legacy_learning_params = legacy_hyper_parameters.learning_parameters

            # Note: legacy_learning_params.batch_size is not present in the new configuration
            # "max_epochs" is sometimes defined as "num_iters"
            setattr(legacy_learning_params, "num_iters", task_training_config.hyperparameters.training.max_epochs)
            setattr(legacy_learning_params, "max_epochs", task_training_config.hyperparameters.training.max_epochs)
            legacy_learning_params.learning_rate = task_training_config.hyperparameters.training.learning_rate
            early_stopping_params = task_training_config.hyperparameters.training.early_stopping
            setattr(legacy_learning_params, "enable_early_stopping", early_stopping_params.enable)
            setattr(legacy_learning_params, "early_stop_patience", early_stopping_params.patience)

            # Legacy configuration stores "model_storage_id", but for convenience we use "model_template_id"
            setattr(legacy_hyper_parameters, "model_template_id", task_training_config.model_manifest_id)

            # Create and set tiling parameters
            if tiling := task_training_config.hyperparameters.dataset_preparation.augmentation.tiling:
                tiling_params = ParameterGroup(header="Tiling", description="Crop dataset to tiles")
                setattr(legacy_hyper_parameters, "tiling_parameters", tiling_params)
                setattr(tiling_params, "enable_tiling", tiling.enable)
                setattr(tiling_params, "enable_adaptive_tiling", tiling.adaptive_tiling)
                setattr(tiling_params, "tile_size", tiling.tile_size)
                setattr(tiling_params, "tile_overlap", tiling.tile_overlap / tiling.tile_size)
                setattr(tiling_params, "object_tile_ratio", 0.05)
                setattr(tiling_params, "tile_max_number", 1500)
                setattr(legacy_hyper_parameters, "tile_sampling_ratio", 1.0)
            # Note: skipping "postprocessing" parameters as not present in the new configuration. Includes:
            # ['confidence_threshold', 'max_num_detections', 'nms_iou_threshold'
            # 'result_based_confidence_threshold', 'use_ellipse_shapes']

            # config types
            legacy_types = cls._get_legacy_config_types(task_type=task_node.task_properties.task_type)

            legacy_subset_manager = legacy_types["subset_manager"]()
            subset_split_parameters = task_training_config.global_parameters.dataset_preparation.subset_split
            legacy_subset_manager.train_validation_remixing = subset_split_parameters.remixing
            legacy_subset_manager.auto_subset_fractions = subset_split_parameters.auto_selection
            # convert from [0, 100] to [0, 1] proportions
            legacy_subset_manager.subset_parameters.train_proportion = subset_split_parameters.training / 100
            legacy_subset_manager.subset_parameters.validation_proportion = subset_split_parameters.validation / 100
            legacy_subset_manager.subset_parameters.test_proportion = subset_split_parameters.test / 100

            # Note: legacy_dataset_counter.label_constraint_first_training is not present in the new configuration
            legacy_dataset_counter = legacy_types["dataset_counter"](
                required_images_auto_training=project_task_config.auto_training.min_images_per_label,
                use_dynamic_required_annotations=project_task_config.auto_training.enable_dynamic_required_annotations,
            )

            # use default as active learning are fully deprecated
            legacy_task_active_learning = legacy_types["task_active_learning"]()

            # only contains auto_training enable parameter
            legacy_task_node = legacy_types["task_node"](auto_training=project_task_config.auto_training.enable)

            legacy_configurable_parameters = [
                HyperParameters(
                    id_=ID("000000000000000000000001"),
                    workspace_id=project_identifier.workspace_id,
                    project_id=project_identifier.project_id,
                    model_storage_id=ID("000000000000000000000001"),  # model_storage_id is only used in legacy configs
                    data=legacy_hyper_parameters,
                ),
                ComponentParameters(
                    id_=ID("000000000000000000000001"),
                    workspace_id=project_identifier.workspace_id,
                    project_id=project_identifier.project_id,
                    task_id=task_id,
                    component=ComponentType.SUBSET_MANAGER,
                    data=legacy_subset_manager,
                ),
                ComponentParameters(
                    id_=ID("000000000000000000000001"),
                    workspace_id=project_identifier.workspace_id,
                    project_id=project_identifier.project_id,
                    task_id=task_id,
                    component=ComponentType.DATASET_COUNTER,
                    data=legacy_dataset_counter,
                ),
                ComponentParameters(
                    id_=ID("000000000000000000000001"),
                    workspace_id=project_identifier.workspace_id,
                    project_id=project_identifier.project_id,
                    task_id=task_id,
                    component=ComponentType.TASK_ACTIVE_LEARNING,
                    data=legacy_task_active_learning,
                ),
                ComponentParameters(
                    id_=ID("000000000000000000000001"),
                    workspace_id=project_identifier.workspace_id,
                    project_id=project_identifier.project_id,
                    task_id=task_id,
                    component=ComponentType.TASK_NODE,
                    data=legacy_task_node,
                ),
            ]
            legacy_task_chain_configs.append(
                {
                    "task": task_node,
                    "configurations": legacy_configurable_parameters,
                }
            )
        return legacy_global_config, legacy_task_chain_configs

    @classmethod
    def forward_mapping(  # noqa: C901
        cls,
        project_identifier: ProjectIdentifier,
        legacy_global_configuration: list[IConfigurableParameterContainer],
        legacy_task_chain_configs: list[dict[str, Any]],
    ) -> tuple[PartialProjectConfiguration, list[PartialTrainingConfiguration]]:
        """
        Convert legacy configuration entities to new ones.

        This method transforms the legacy configuration format to the new format
        (ProjectConfiguration and TrainingConfiguration).

        :param project_identifier: Identifier for the project
        :param legacy_global_configuration: List of legacy global configuration parameters
        :param legacy_task_chain_configs: List of legacy task chain configurations
        :return: A tuple containing:
                - ProjectConfiguration: New format project configuration
                - list[TrainingConfiguration]: List of new format training configurations for all tasks
        """
        project_config = PartialProjectConfiguration(task_configs=[], project_id=project_identifier.project_id)
        training_configs: list[PartialTrainingConfiguration] = []

        # Extract dataset management config from global configuration
        dataset_management_config = next(
            (
                config
                for config in legacy_global_configuration
                if isinstance(config, DatasetManagementConfig)
                or (getattr(config, "component", None) == ComponentType.PIPELINE_DATASET_MANAGER)
            ),
            DatasetManagementConfig(header="Dataset Management"),
        )

        # Process each task configuration
        for task_config_dict in legacy_task_chain_configs:
            task_node = task_config_dict["task"]
            task_id = str(task_node.id_)
            legacy_configs = task_config_dict["configurations"]

            # Extract configurations by type
            legacy_config_types = cls._get_legacy_config_types(task_type=task_node.task_properties.task_type)
            # Note active learning parameters are skipped

            legacy_hyperparams = None
            legacy_subset_manager = None
            legacy_dataset_counter = None
            legacy_task_node = None
            for config in legacy_configs:
                component_type = getattr(config, "component", None)
                if isinstance(config, HyperParameters | DefaultModelParameters):
                    legacy_hyperparams = config
                elif (
                    isinstance(config, legacy_config_types["subset_manager"])
                    or component_type is ComponentType.SUBSET_MANAGER
                ):
                    legacy_subset_manager = config
                elif (
                    isinstance(config, legacy_config_types["dataset_counter"])
                    or component_type is ComponentType.DATASET_COUNTER
                ):
                    legacy_dataset_counter = config
                elif isinstance(config, legacy_config_types["task_node"]) or component_type is ComponentType.TASK_NODE:
                    legacy_task_node = config
            if not legacy_hyperparams:
                legacy_hyperparams = DefaultModelParameters()

            # Create new configuration objects
            # 1. Global parameters
            # Extract maximum and minimum annotation sizes from legacy global dataset management config
            # this means that all tasks in the project will use the same values
            max_annotations = dataset_management_config.maximum_number_of_annotations
            min_annotations = dataset_management_config.minimum_annotation_size
            global_params = {
                "dataset_preparation": {
                    "subset_split": {
                        "training": (
                            int(legacy_subset_manager.subset_parameters.train_proportion * 100)
                            if legacy_subset_manager
                            else 70
                        ),
                        "validation": (
                            int(legacy_subset_manager.subset_parameters.validation_proportion * 100)
                            if legacy_subset_manager
                            else 20
                        ),
                        "test": (
                            int(legacy_subset_manager.subset_parameters.test_proportion * 100)
                            if legacy_subset_manager
                            else 10
                        ),
                        "auto_selection": (
                            legacy_subset_manager.auto_subset_fractions if legacy_subset_manager else True
                        ),
                        "remixing": (
                            legacy_subset_manager.train_validation_remixing if legacy_subset_manager else False
                        ),
                    },
                    "filtering": {
                        "min_annotation_pixels": {
                            "enable": min_annotations > 0,
                            "min_annotation_pixels": max(min_annotations, 1),
                        },
                        "max_annotation_objects": {
                            "enable": max_annotations > 0,
                            "max_annotation_objects": max(max_annotations, 1),
                        },
                    },
                }
            }

            # 2. Hyperparameters
            hyperparams = cls.forward_hyperparameters(legacy_hyperparams=legacy_hyperparams)

            # 3. Update project configuration with auto-training settings
            auto_training_enabled = False
            if legacy_task_node is not None and hasattr(legacy_task_node, "auto_training"):
                auto_training_enabled = legacy_task_node.auto_training

            min_images_per_label = 0
            enable_dynamic_required_annotations = False
            if legacy_dataset_counter is not None:
                min_images_per_label = getattr(legacy_dataset_counter, "required_images_auto_training", 0)
                enable_dynamic_required_annotations = getattr(
                    legacy_dataset_counter, "use_dynamic_required_annotations", False
                )

            # Add task configuration to project configuration
            project_task_config_dict = {
                "task_id": task_id,
                "auto_training": {
                    "enable": auto_training_enabled,
                    "min_images_per_label": min_images_per_label,
                    "enable_dynamic_required_annotations": enable_dynamic_required_annotations,
                },
            }
            project_config.task_configs.append(PartialTaskConfig.model_validate(project_task_config_dict))

            # Create training configuration for this task
            model_manifest_id = None
            if entity_identifier := getattr(legacy_hyperparams, "entity_identifier", None):
                model_storage = ModelStorageRepo(project_identifier).get_by_id(entity_identifier.model_storage_id)
                model_manifest_id = model_storage.model_template_id
            elif hasattr(legacy_hyperparams, "model_template_id"):
                model_manifest_id = getattr(legacy_hyperparams, "model_template_id")

            training_config_dict = {
                "task_id": task_id,
                "model_manifest_id": model_manifest_id,
                "global_parameters": global_params,
                "hyperparameters": hyperparams.model_dump(),
            }
            training_configs.append(PartialTrainingConfiguration.model_validate(training_config_dict))

        return project_config, training_configs

    @staticmethod
    def _get_legacy_config_types(task_type: TaskType) -> dict:
        """
        Get legacy configuration types based on task type.

        This helper method retrieves the appropriate legacy configuration types from the
        ConfigurableComponentRegister for a given task type.

        :param task_type: The type of task (e.g., classification, detection, segmentation)
        :return: A dictionary mapping configuration component names to their corresponding types:
                - "subset_manager": Legacy subset manager type
                - "dataset_counter": Legacy dataset counter type
                - "task_active_learning": Legacy task active learning type
                - "task_node": Legacy task node type
                - "pipeline_dataset_manager": Legacy pipeline dataset manager type
        """
        legacy_subset_manager_register_data = ConfigurableComponentRegister[ComponentType.SUBSET_MANAGER.name].value
        legacy_subset_manager_type = legacy_subset_manager_register_data.get_configuration_type(task_type=task_type)
        legacy_dataset_counter_register_data = ConfigurableComponentRegister[ComponentType.DATASET_COUNTER.name].value
        legacy_dataset_counter_type = legacy_dataset_counter_register_data.get_configuration_type(task_type=task_type)
        legacy_task_active_learning_register_data = ConfigurableComponentRegister[
            ComponentType.TASK_ACTIVE_LEARNING.name
        ].value
        legacy_task_active_learning_type = legacy_task_active_learning_register_data.get_configuration_type(
            task_type=task_type
        )
        legacy_task_node_register_data = ConfigurableComponentRegister[ComponentType.TASK_NODE.name].value
        legacy_task_node_type = legacy_task_node_register_data.get_configuration_type(task_type=task_type)
        legacy_pipeline_dataset_manager_register_data = ConfigurableComponentRegister[
            ComponentType.PIPELINE_DATASET_MANAGER.name
        ].value
        legacy_pipeline_dataset_manager_type = legacy_pipeline_dataset_manager_register_data.get_configuration_type(
            task_type=task_type
        )
        return {
            "subset_manager": legacy_subset_manager_type,
            "dataset_counter": legacy_dataset_counter_type,
            "task_active_learning": legacy_task_active_learning_type,
            "task_node": legacy_task_node_type,
            "pipeline_dataset_manager": legacy_pipeline_dataset_manager_type,
        }

    @staticmethod
    def forward_hyperparameters(  # noqa: C901
        legacy_hyperparams: Hyperparameters | IConfigurableParameterContainer | ConfigurableParameters,
    ) -> Hyperparameters:
        """ """
        # Create tiling parameters if enabled
        tiling = None
        if legacy_tiling := getattr(legacy_hyperparams, "tiling_parameters", None):
            tile_size = legacy_tiling.tile_size
            adaptive = getattr(legacy_tiling, "enable_adaptive_tiling", None) or getattr(
                legacy_tiling, "enable_adaptive_params", None
            )
            tiling = Tiling(
                enable=legacy_tiling.enable_tiling,
                adaptive_tiling=adaptive,
                tile_size=tile_size,
                tile_overlap=int(legacy_tiling.tile_overlap * tile_size) if tile_size > 0 else 0,
            )

        # Create augmentation parameters
        augmentation = AugmentationParameters(tiling=tiling)

        # Create training hyperparameters
        # Check if legacy_hyperparams has learning_parameters before accessing
        legacy_learning_parameters = getattr(legacy_hyperparams, "learning_parameters", None)
        early_stopping = None

        if legacy_learning_parameters and hasattr(legacy_learning_parameters, "enable_early_stopping"):
            early_stopping_enabled = getattr(legacy_learning_parameters, "enable_early_stopping", False)
            if early_stopping_enabled and hasattr(legacy_learning_parameters, "early_stop_patience"):
                early_stopping = getattr(legacy_learning_parameters, "early_stop_patience")
        # Anomaly tasks have difference structure
        elif legacy_learning_parameters and hasattr(legacy_learning_parameters, "early_stopping"):
            early_stopping_obj = getattr(legacy_learning_parameters, "early_stopping")
            if hasattr(early_stopping_obj, "patience"):
                early_stopping = early_stopping_obj.patience

        learning_rate = 0.001
        if legacy_learning_parameters:
            for alias in ["learning_rate", "lr"]:
                if hasattr(legacy_learning_parameters, alias):
                    learning_rate = getattr(legacy_learning_parameters, alias)

        max_epochs = 1000
        if legacy_learning_parameters:
            for max_epochs_alias in ["num_iters", "max_epochs", "max_num_epochs"]:
                if hasattr(legacy_learning_parameters, max_epochs_alias):
                    max_epochs = getattr(legacy_learning_parameters, max_epochs_alias)
                    break

        training_params = TrainingHyperParameters(
            max_epochs=max_epochs,
            learning_rate=learning_rate,
            early_stopping=(EarlyStopping(enable=True, patience=early_stopping) if early_stopping else EarlyStopping()),
            max_detection_per_image=MaxDetectionPerImage(),
        )

        return Hyperparameters(
            dataset_preparation=DatasetPreparationParameters(augmentation=augmentation),
            training=training_params,
            evaluation=EvaluationParameters(),
        )
