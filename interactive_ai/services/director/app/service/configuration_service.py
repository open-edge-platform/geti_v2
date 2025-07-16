# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from geti_configuration_tools import ConfigurationOverlayTools
from geti_configuration_tools.training_configuration import PartialTrainingConfiguration, TrainingConfiguration
from geti_supported_models import NullModelManifest, SupportedModels

from communication.exceptions import ModelManifestNotFoundException
from storage.repos.partial_training_configuration_repo import PartialTrainingConfigurationRepo

from geti_fastapi_tools.exceptions import ModelNotFoundException
from geti_types import ID, ModelStorageIdentifier, ProjectIdentifier
from iai_core.entities.model import NullModel
from iai_core.entities.model_storage import ModelStorage
from iai_core.repos import ModelRepo, ModelStorageRepo


class ConfigurationService:
    @classmethod
    def get_full_training_configuration(
        cls,
        project_identifier: ProjectIdentifier,
        task_id: ID,
        model_manifest_id: str,
    ) -> TrainingConfiguration:
        """
        Get the full training configuration for a specific model architecture.

        The full training configuration is obtained by merging the base model manifest hyperparameters
        of a specific model architecture with the task-level configuration parameters and any
        model manifest-specific configurable parameters. This merged configuration provides all the
        necessary settings for training a model for the given task.

        :param project_identifier: Identifier for the project
        :param task_id: ID of the task for which to get the configuration
        :param model_manifest_id: ID of the model manifest to use for algorithm-level configuration
        :return: The combined and validated training configuration
        """
        model_manifest = SupportedModels.get_model_manifest_by_id(model_manifest_id)
        if isinstance(model_manifest, NullModelManifest):
            raise ModelManifestNotFoundException(model_manifest_id=model_manifest_id)

        base_config = PartialTrainingConfiguration.model_validate(
            {
                "id_": ID(f"full_training_configuration_{model_manifest_id}"),
                "task_id": str(task_id),
                "hyperparameters": model_manifest.hyperparameters.model_dump(),
            }
        )
        training_configuration_repo = PartialTrainingConfigurationRepo(project_identifier)
        task_level_config = training_configuration_repo.get_task_only_configuration(task_id)
        algo_level_config = (
            training_configuration_repo.get_by_model_manifest_id(model_manifest_id) if model_manifest_id else None
        )
        return ConfigurationOverlayTools.overlay_training_configurations(
            base_config, task_level_config, algo_level_config, validate_full_config=True
        )

    @staticmethod
    def get_configuration_from_model(
        project_identifier: ProjectIdentifier, task_id: ID, model_id: ID
    ) -> tuple[dict, ModelStorage]:
        """
        Returns the hyperparameters that were used to train a model as a dictionary. This is not
        the current configuration, but the configuration used, from the history of the
        model. Additionally, return the ID of the model storage the model lives in.

        :param project_identifier: Identifier of the project
        :param task_id: ID of the task this model belongs to
        :param model_id: ID of the model to get the related configuration for
        :raises ModelNotFoundException: If the model with ID `model_id` was not found
            in any of the model storages for the task
        :return: Tuple containing:
            - Dict containing training hyperparameters that were used to generate the model
            - Model storage the model lives in
        """
        task_model_storages = ModelStorageRepo(project_identifier).get_by_task_node_id(task_id)

        for model_storage in task_model_storages:
            model_storage_identifier = ModelStorageIdentifier(
                workspace_id=project_identifier.workspace_id,
                project_id=project_identifier.project_id,
                model_storage_id=model_storage.id_,
            )
            model = ModelRepo(model_storage_identifier).get_by_id(model_id)
            if not isinstance(model, NullModel):
                return model.configuration.display_only_configuration, model_storage
        raise ModelNotFoundException(model_id)
