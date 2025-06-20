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
from geti_configuration_tools.project_configuration import ProjectConfiguration
from geti_configuration_tools.training_configuration import (
    Filtering,
    GlobalDatasetPreparationParameters,
    GlobalParameters,
    MaxAnnotationObjects,
    MaxAnnotationPixels,
    MinAnnotationObjects,
    MinAnnotationPixels,
    SubsetSplit,
    TrainingConfiguration,
)

from active_learning.entities import ActiveLearningProjectConfig
from configuration import ConfigurableComponentRegister
from storage.repos.partial_training_configuration_repo import PartialTrainingConfigurationRepo

from geti_types import ID, ProjectIdentifier
from iai_core.configuration.elements.component_parameters import ComponentParameters
from iai_core.configuration.elements.configurable_parameters import ConfigurableParameters
from iai_core.configuration.elements.dataset_manager_parameters import DatasetManagementConfig
from iai_core.configuration.elements.default_model_parameters import DefaultModelParameters
from iai_core.configuration.elements.hyper_parameters import HyperParameters
from iai_core.configuration.elements.parameter_group import ParameterGroup
from iai_core.configuration.enums import ComponentType
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
    ) -> tuple[list[ConfigurableParameters], list[dict[str, Any]]]:
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
        legacy_global_config: list[ConfigurableParameters] = [
            ActiveLearningProjectConfig(),  # fully deprecated, use default values
            DatasetManagementConfig(
                minimum_annotation_size=filtering_parameters.min_annotation_pixels.min_annotation_pixels,
                maximum_number_of_annotations=filtering_parameters.max_annotation_objects.max_annotation_objects,
            ),
        ]

        legacy_task_chain_configs = []
        for task_training_config in all_training_configurations:
            task_node = TaskNodeRepo(project_identifier).get_by_id(ID(task_training_config.task_id))
            project_task_config = project_configuration.get_task_config(task_training_config.task_id)

            legacy_hyper_parameters = DefaultModelParameters()
            legacy_learning_params = legacy_hyper_parameters.learning_parameters
            # Note: legacy_learning_params.batch_size is not present in the new configuration
            # "max_epochs" is sometimes defined as "num_iters"
            legacy_learning_params.num_iters = task_training_config.hyperparameters.training.max_epochs
            legacy_learning_params.max_epochs = task_training_config.hyperparameters.training.max_epochs
            legacy_learning_params.learning_rate = task_training_config.hyperparameters.training.learning_rate
            early_stopping_params = task_training_config.hyperparameters.training.early_stopping
            legacy_learning_params.enable_early_stopping = early_stopping_params.enable
            legacy_learning_params.early_stop_patience = early_stopping_params.patience

            # Legacy configuration stores "model_storage_id", but for convenience we use "model_template_id"
            legacy_hyper_parameters.model_template_id = task_training_config.model_manifest_id

            # Tiling
            if tiling := task_training_config.hyperparameters.dataset_preparation.augmentation.tiling:
                legacy_hyper_parameters.tiling_parameters = ParameterGroup(
                    header="Tiling", description="Crop dataset to tiles"
                )
                legacy_hyper_parameters.tiling_parameters.enable_tiling = tiling.enable
                legacy_hyper_parameters.tiling_parameters.enable_adaptive_tiling = tiling.adaptive_tiling
                legacy_hyper_parameters.tiling_parameters.tile_size = tiling.tile_size
                legacy_hyper_parameters.tiling_parameters.tile_overlap = tiling.tile_overlap / tiling.tile_size
                legacy_hyper_parameters.tiling_parameters.object_tile_ratio = 0.05
                legacy_hyper_parameters.tiling_parameters.tile_max_number = 1500
                legacy_hyper_parameters.tile_sampling_ratio = 1.0
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

            task_filtering_parameters = task_training_config.global_parameters.dataset_preparation.filtering
            legacy_pipeline_dataset_manager = legacy_types["pipeline_dataset_manager"](
                maximum_number_of_annotations=(
                    task_filtering_parameters.max_annotation_objects.max_annotation_objects
                    if task_filtering_parameters.max_annotation_objects.enable
                    else -1
                ),
                minimum_annotation_size=(
                    task_filtering_parameters.min_annotation_pixels.min_annotation_pixels
                    if task_filtering_parameters.min_annotation_pixels.enable
                    else -1
                ),
            )

            legacy_configurable_parameters = [
                legacy_hyper_parameters,
                legacy_subset_manager,
                legacy_dataset_counter,
                legacy_task_active_learning,
                legacy_task_node,
                legacy_pipeline_dataset_manager,
            ]
            legacy_task_chain_configs.append(
                {
                    "task": task_node,
                    "configurations": legacy_configurable_parameters,
                }
            )
        return legacy_global_config, legacy_task_chain_configs

    @classmethod
    def forward_mapping(  # noqa: PLR0912, PLR0915, C901
        cls,
        project_identifier: ProjectIdentifier,
        legacy_global_configuration: list[ComponentParameters],
        legacy_task_chain_configs: list[dict[str, Any]],
    ) -> tuple[ProjectConfiguration, list[TrainingConfiguration]]:
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
        task_ids = [task_chain_config["task"].id_ for task_chain_config in legacy_task_chain_configs]
        project_config = ProjectConfiguration.default_configuration(
            project_id=project_identifier.project_id, task_ids=task_ids
        )
        training_configs = []

        # Extract dataset management config from global configuration
        dataset_management_config = next(
            (config for config in legacy_global_configuration if isinstance(config, DatasetManagementConfig)),
            DatasetManagementConfig(),
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
            legacy_pipeline_dataset_manager = None
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
                elif (
                    isinstance(config, legacy_config_types["pipeline_dataset_manager"])
                    or component_type is ComponentType.PIPELINE_DATASET_MANAGER
                ):
                    legacy_pipeline_dataset_manager = config
            if not legacy_hyperparams:
                legacy_hyperparams = DefaultModelParameters()

            # Create new configuration objects
            # 1. Global parameters
            subset_split = SubsetSplit(
                training=int(legacy_subset_manager.subset_parameters.train_proportion * 100)
                if legacy_subset_manager
                else 70,
                validation=int(legacy_subset_manager.subset_parameters.validation_proportion * 100)
                if legacy_subset_manager
                else 20,
                test=int(legacy_subset_manager.subset_parameters.test_proportion * 100)
                if legacy_subset_manager
                else 10,
                auto_selection=legacy_subset_manager.auto_subset_fractions if legacy_subset_manager else True,
                remixing=legacy_subset_manager.train_validation_remixing if legacy_subset_manager else False,
            )

            project_wide_max_annotations = dataset_management_config.maximum_number_of_annotations
            task_wide_max_annotations = (
                legacy_pipeline_dataset_manager.maximum_number_of_annotations
                if legacy_pipeline_dataset_manager
                else None
            )
            max_annotations = (
                task_wide_max_annotations if task_wide_max_annotations is not None else project_wide_max_annotations
            )
            project_wide_min_annotations = dataset_management_config.minimum_annotation_size
            task_wide_min_annotations = (
                legacy_pipeline_dataset_manager.minimum_annotation_size if legacy_pipeline_dataset_manager else None
            )
            min_annotations = (
                task_wide_min_annotations if task_wide_min_annotations is not None else project_wide_min_annotations
            )
            filtering = Filtering(
                min_annotation_pixels=MinAnnotationPixels(
                    enable=min_annotations > 0,
                    min_annotation_pixels=max(min_annotations, 1),
                ),
                max_annotation_pixels=MaxAnnotationPixels(),
                min_annotation_objects=MinAnnotationObjects(),
                max_annotation_objects=MaxAnnotationObjects(
                    enable=max_annotations > 0,
                    max_annotation_objects=max(max_annotations, 1),
                ),
            )

            global_params = GlobalParameters(
                dataset_preparation=GlobalDatasetPreparationParameters(
                    subset_split=subset_split,
                    filtering=filtering,
                ),
            )

            # 2. Hyperparameters
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
            legacy_learning_parameters = legacy_hyperparams.learning_parameters
            early_stopping = None
            if getattr(legacy_learning_parameters, "enable_early_stopping", None):
                early_stopping = legacy_learning_parameters.early_stop_patience
            # Anomaly tasks have difference structure
            elif getattr(legacy_learning_parameters, "early_stopping", None):
                early_stopping = legacy_learning_parameters.early_stopping.patience

            learning_rate = 0.001
            for alias in ["learning_rate", "lr"]:
                if hasattr(legacy_learning_parameters, alias):
                    learning_rate = getattr(legacy_learning_parameters, alias)

            max_epochs = 1000
            for max_epochs_alias in ["num_iters", "max_epochs", "max_num_epochs"]:
                if hasattr(legacy_learning_parameters, max_epochs_alias):
                    max_epochs = getattr(legacy_learning_parameters, max_epochs_alias)
                    break
            training_params = TrainingHyperParameters(
                max_epochs=max_epochs,
                learning_rate=learning_rate,
                early_stopping=(
                    EarlyStopping(enable=True, patience=early_stopping) if early_stopping else EarlyStopping()
                ),
                max_detection_per_image=MaxDetectionPerImage(),
            )

            hyperparams = Hyperparameters(
                dataset_preparation=DatasetPreparationParameters(augmentation=augmentation),
                training=training_params,
                evaluation=EvaluationParameters(),
            )

            # 3. Update project configuration with auto-training settings
            auto_training_enabled = legacy_task_node.auto_training
            min_images_per_label = legacy_dataset_counter.required_images_auto_training if legacy_dataset_counter else 0
            enable_dynamic_required_annotations = (
                legacy_dataset_counter.use_dynamic_required_annotations if legacy_dataset_counter else False
            )

            # Add task configuration to project configuration
            project_task_config = project_config.get_task_config(task_id=task_id)
            project_task_config.auto_training.enable = auto_training_enabled
            project_task_config.auto_training.min_images_per_label = min_images_per_label
            project_task_config.auto_training.enable_dynamic_required_annotations = enable_dynamic_required_annotations

            # Create training configuration for this task
            if entity_identifier := getattr(legacy_hyperparams, "entity_identifier", None):
                model_storage = ModelStorageRepo(project_identifier).get_by_id(entity_identifier.model_storage_id)
                model_manifest_id = model_storage.model_template_id
            else:
                # if entity identifier is not set, then the config must come from the backward compatibility
                model_manifest_id = legacy_hyperparams.model_template_id
            training_config = TrainingConfiguration(
                id_=PartialTrainingConfigurationRepo.generate_id(),
                task_id=task_id,
                model_manifest_id=model_manifest_id,
                global_parameters=global_params,
                hyperparameters=hyperparams,
            )
            training_configs.append(training_config)

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
