# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import logging
from typing import Any

from geti_configuration_tools import ConfigurationOverlayTools
from geti_configuration_tools.project_configuration import (
    NullProjectConfiguration,
    PartialProjectConfiguration,
    TaskConfig,
)

from communication.exceptions import ProjectConfigurationNotFoundException
from communication.views.project_configuration_rest_views import ProjectConfigurationRESTViews
from storage.repos.project_configuration_repo import ProjectConfigurationRepo

from geti_telemetry_tools import unified_tracing
from geti_types import ID, ProjectIdentifier
from iai_core.repos import ProjectRepo, TaskNodeRepo

logger = logging.getLogger(__name__)


class ProjectConfigurationRESTController:
    @staticmethod
    @unified_tracing
    def get_configuration(
        project_identifier: ProjectIdentifier,
    ) -> dict[str, Any]:
        """
        Retrieves configuration related to a specific project.

        :param project_identifier: Identifier for the project (containing organization_id, workspace_id, and project_id)
        :return: Dictionary representation of the project configuration
        """
        project_config_repo = ProjectConfigurationRepo(project_identifier)
        project_config = project_config_repo.get_project_configuration()
        if isinstance(project_config, NullProjectConfiguration):
            # create default configuration in case the project exists but has no configuration
            if ProjectRepo().exists(project_identifier.project_id):
                logger.warning(
                    f"Project configuration for project {project_identifier.project_id} not found, "
                    f"creating default configuration."
                )
                task_ids = list(TaskNodeRepo(project_identifier).get_trainable_task_ids())
                project_config_repo.create_default_configuration(task_ids=task_ids)
                project_config = project_config_repo.get_project_configuration()
            else:
                raise ProjectConfigurationNotFoundException(project_identifier.project_id)
        return ProjectConfigurationRESTViews.project_configuration_to_rest(project_config)

    @staticmethod
    @unified_tracing
    def update_configuration(
        project_identifier: ProjectIdentifier,
        update_configuration: PartialProjectConfiguration,
    ) -> None:
        """
        Updates the configuration for a specific project.

        :param project_identifier: Identifier for the project (containing organization_id, workspace_id, and project_id)
        :param update_configuration: Dictionary representation of the new project configuration
        :return: Updated dictionary representation of the project configuration
        """
        if not update_configuration.task_configs:
            return

        repo = ProjectConfigurationRepo(project_identifier)
        current_config = repo.get_project_configuration()
        current_task_config_map = {task_config.task_id: task_config for task_config in current_config.task_configs}

        for task_config in update_configuration.task_configs:
            if task_config.task_id not in current_task_config_map:
                raise ProjectConfigurationNotFoundException(
                    project_id=project_identifier.project_id,
                    task_id=ID(task_config.task_id),
                )
            # Update existing task config
            current_task_config = current_task_config_map[task_config.task_id]
            updated_task_config_dict = ConfigurationOverlayTools.delete_none_from_dict(task_config.model_dump())
            merged_task_config_dict = ConfigurationOverlayTools.merge_deep_dict(
                current_task_config.model_dump(), updated_task_config_dict
            )
            current_task_config_map[task_config.task_id] = TaskConfig.model_validate(merged_task_config_dict)

        for _, task_config in current_task_config_map.items():
            repo.update_task_config(task_config)
