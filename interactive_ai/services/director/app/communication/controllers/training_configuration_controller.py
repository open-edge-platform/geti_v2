# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import logging
from typing import Any

from geti_configuration_tools import ConfigurationOverlayTools
from geti_configuration_tools.training_configuration import NullTrainingConfiguration, PartialTrainingConfiguration

from communication.backward_compatibility.configurations import ConfigurationsBackwardCompatibility
from communication.exceptions import (
    MissingTaskIDException,
    NotSupportedConfigurableParameterException,
    TaskNodeNotFoundException,
)
from communication.views.training_configuration_rest_views import TrainingConfigurationRESTViews
from service.configuration_service import ConfigurationService
from storage.repos.partial_training_configuration_repo import PartialTrainingConfigurationRepo

from geti_telemetry_tools import unified_tracing
from geti_types import ID, ProjectIdentifier
from iai_core.entities.annotation_scene_state import AnnotationState
from iai_core.entities.task_node import NullTaskNode
from iai_core.repos import AnnotationSceneStateRepo, DatasetStorageRepo, ModelRepo, TaskNodeRepo

logger = logging.getLogger(__name__)


class TrainingConfigurationRESTController:
    @classmethod
    @unified_tracing
    def get_configuration(
        cls,
        project_identifier: ProjectIdentifier,
        task_id: ID | None = None,
        model_manifest_id: str | None = None,
        model_id: ID | None = None,
    ) -> dict[str, Any]:
        """
        Retrieves training configuration.

        If model_id is provided, the configuration is loaded from the model entity.

        :param project_identifier: Identifier for the project (containing organization_id, workspace_id, and project_id)
        :param task_id: ID of the task to retrieve configuration for
        :param model_manifest_id: Optional ID of the model manifest to retrieve specific configurations
        :param model_id: Optional ID of the model to retrieve specific configurations
        :return: Dictionary representation of the training configuration
        :raises TaskNotFoundException: If the task does not exist
        """
        # task_id can be None if the project is single-task
        task_node_repo = TaskNodeRepo(project_identifier)
        if task_id is None:
            task_ids = list(task_node_repo.get_trainable_task_ids())
            if len(task_ids) != 1:
                raise MissingTaskIDException
            task_id = task_ids[0]

        if not task_node_repo.exists(task_id):
            raise TaskNodeNotFoundException(task_node_id=task_id)

        if model_id is not None:
            model_parameters_dict, model_storage = ConfigurationService.get_configuration_from_model(
                project_identifier=project_identifier,
                task_id=task_id,
                model_id=model_id,
            )
            if not model_parameters_dict:
                model = ModelRepo(model_storage.identifier).get_by_id(model_id)
                model_hyperparams = ConfigurationsBackwardCompatibility.forward_hyperparameters(
                    legacy_hyperparams=model.configuration.configurable_parameters
                )
                model_parameters_dict = model_hyperparams.model_dump()
            advanced_model_configuration = model_parameters_dict.pop("advanced_model_configuration", None)
            model_config = PartialTrainingConfiguration.model_validate(
                {
                    "task_id": task_id,
                    "model_manifest_id": model_storage.model_template.model_template_id,
                    "hyperparameters": model_parameters_dict,
                }
            )
            rest_view = TrainingConfigurationRESTViews.training_configuration_to_rest(model_config)
            if advanced_model_configuration is not None:
                rest_view["advanced_configuration"] = advanced_model_configuration
            return rest_view

        training_configuration_repo = PartialTrainingConfigurationRepo(project_identifier)
        task_level_config = training_configuration_repo.get_task_only_configuration(task_id)
        # create default configuration in case the task exists but has no training configuration yet
        if isinstance(task_level_config, NullTrainingConfiguration):
            logger.warning(
                f"Task training configuration for project `{project_identifier.project_id}` and task `{task_id}` "
                f"not found, creating default training configuration."
            )
            task = task_node_repo.get_by_id(task_id)
            training_configuration_repo.create_default_task_only_configuration(task)
            task_level_config = training_configuration_repo.get_task_only_configuration(task_id)

        dataset_size = cls._get_dataset_size(
            project_identifier=project_identifier,
            task_id=task_id,
        )
        if model_manifest_id is None:
            task_level_config.global_parameters.dataset_preparation.subset_split.dataset_size = dataset_size
            # Only task level configuration can be retrieved
            return TrainingConfigurationRESTViews.training_configuration_to_rest(
                training_configuration=task_level_config
            )

        # If model_manifest_id is available, the full configuration can be built
        full_config = ConfigurationService.get_full_training_configuration(
            project_identifier=project_identifier,
            task_id=task_id,
            model_manifest_id=model_manifest_id,
        )
        full_config.global_parameters.dataset_preparation.subset_split.dataset_size = dataset_size
        return TrainingConfigurationRESTViews.training_configuration_to_rest(training_configuration=full_config)

    @classmethod
    @unified_tracing
    def update_configuration(
        cls,
        project_identifier: ProjectIdentifier,
        update_configuration: PartialTrainingConfiguration,
    ) -> None:
        """
        Updates a training configuration.

        This method handles both task-level and algorithm-level configurations:
        - Task-level: Applied to all model architectures for a given task. Used when
          model_manifest_id is not provided in the update_configuration.
        - Algorithm-level: Specific to a particular model architecture. Applied on top
          of task-level configuration and overwrites any conflicting parameters. Used
          when model_manifest_id is provided.

        :param project_identifier: Identifier for the project
        :param update_configuration: The configuration to update with
        :raises TaskNotFoundException: If the specified task does not exist
        """
        training_configuration_repo = PartialTrainingConfigurationRepo(project_identifier)

        task_id = ID(update_configuration.task_id)
        task = TaskNodeRepo(project_identifier).get_by_id(task_id)
        if isinstance(task, NullTaskNode):
            raise TaskNodeNotFoundException(task_node_id=task_id)

        try:
            if (
                update_configuration.global_parameters.dataset_preparation.filtering
                and not task.task_properties.has_annotations_with_area
            ):
                raise NotSupportedConfigurableParameterException(
                    parameter_name="filtering", task_type=task.task_properties.task_type.name
                )
        except AttributeError:
            pass  # if filtering is not set, no need to check if it is supported

        # configuration is saved as "task level"
        if not update_configuration.model_manifest_id:
            task_config = training_configuration_repo.get_task_only_configuration(task_id)
            new_config = ConfigurationOverlayTools.overlay_training_configurations(
                task_config, update_configuration, validate_full_config=False
            )
            training_configuration_repo.save(new_config)
            return

        # configuration is saved as "algorithm level"
        current_config = training_configuration_repo.get_by_model_manifest_id(
            model_manifest_id=update_configuration.model_manifest_id
        )
        if isinstance(current_config, NullTrainingConfiguration):
            # If the configuration does not exist, create a new one
            update_configuration.id_ = training_configuration_repo.generate_id()
            training_configuration_repo.save(update_configuration)
            return

        new_config = ConfigurationOverlayTools.overlay_training_configurations(
            current_config,
            update_configuration,
            validate_full_config=False,
        )
        training_configuration_repo.save(new_config)

    @staticmethod
    def _get_dataset_size(project_identifier: ProjectIdentifier, task_id: ID) -> int:
        annotation_states = [
            AnnotationState.ANNOTATED,
            AnnotationState.PARTIALLY_ANNOTATED,
        ]
        dataset_storage = DatasetStorageRepo(project_identifier).get_one(extra_filter={"use_for_training": True})
        repo = AnnotationSceneStateRepo(dataset_storage.identifier)
        n_annotated_images = repo.count_images_state_for_task(annotation_states=annotation_states, task_id=task_id)
        n_annotated_frames = repo.count_video_frames_state_for_task(
            annotation_states=annotation_states, task_id=task_id
        )
        return n_annotated_images + n_annotated_frames
