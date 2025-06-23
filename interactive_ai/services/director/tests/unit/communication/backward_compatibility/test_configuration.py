# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from unittest.mock import patch

import pytest

from communication.backward_compatibility.configurations import ConfigurationsBackwardCompatibility

from geti_types import ID
from iai_core.repos import ConfigurableParametersRepo, ModelStorageRepo, TaskNodeRepo


class TestConfigurationBackwardCompatibility:
    @pytest.mark.parametrize(
        "legacy_hyperparameters_doc_fixture, expected_revamped_configuration_fixture",
        (
            ("fxt_legacy_classification_config_doc", "fxt_revamped_classification_configs"),
            ("fxt_legacy_detection_config_doc", "fxt_revamped_detection_configs"),
            ("fxt_legacy_rotated_detection_config_doc", "fxt_revamped_rotated_detection_configs"),
            ("fxt_legacy_instance_segmentation_config_doc", "fxt_revamped_instance_segmentation_configs"),
            ("fxt_legacy_semantic_segmentation_config_doc", "fxt_revamped_semantic_segmentation_configs"),
            ("fxt_legacy_anomaly_stfpm_config_doc", "fxt_revamped_anomaly_stfpm_configs"),
            ("fxt_legacy_anomaly_padim_config_doc", "fxt_revamped_anomaly_padim_configs"),
            ("fxt_legacy_uflow_config_doc", "fxt_revamped_uflow_configs"),
        ),
        ids=[
            "Legacy Classification Configuration",
            "Legacy Detection Configuration",
            "Legacy Rotated Detection Configuration",
            "Legacy Instance Segmentation Configuration",
            "Legacy Semantic Segmentation Configuration",
            "Legacy Anomaly STFPM Configuration",
            "Legacy Anomaly Padim Configuration",
            "Legacy UFlow Configuration",
        ],
    )
    def test_mapping(
        self,
        request,
        legacy_hyperparameters_doc_fixture,
        expected_revamped_configuration_fixture,
        fxt_revamped_project_configuration,
        fxt_global_config_docs,
        fxt_task_config_docs,
        fxt_project_identifier,
        fxt_task,
        fxt_model_storage,
    ) -> None:
        # Arrange
        config_params_repo = ConfigurableParametersRepo(fxt_project_identifier)

        def legacy_config_mapper(doc):
            doc["_id"] = ID("legacy_config_id")
            doc["workspace_id"] = fxt_project_identifier.workspace_id
            doc["project_id"] = fxt_project_identifier.project_id
            return config_params_repo.backward_map(doc)

        config_doc = request.getfixturevalue(legacy_hyperparameters_doc_fixture)
        legacy_task_chain_configurations = [
            legacy_config_mapper(config_doc),
            *[legacy_config_mapper(doc) for doc in fxt_task_config_docs],
        ]
        legacy_global_configuration = [legacy_config_mapper(doc) for doc in fxt_global_config_docs]

        expected_training_configuration = request.getfixturevalue(expected_revamped_configuration_fixture)
        expected_project_configuration = fxt_revamped_project_configuration

        # Act
        with (
            patch.object(ModelStorageRepo, "get_by_id", return_value=fxt_model_storage),
            patch.object(TaskNodeRepo, "get_by_id", return_value=fxt_task),
        ):
            # map forward
            project_configuration, training_configurations = ConfigurationsBackwardCompatibility.forward_mapping(
                project_identifier=fxt_project_identifier,
                legacy_global_configuration=legacy_global_configuration,
                legacy_task_chain_configs=[{"task": fxt_task, "configurations": legacy_task_chain_configurations}],
            )

            # check that it matches the expected output
            assert len(training_configurations) == 1
            assert project_configuration.model_dump() == expected_project_configuration.model_dump()
            assert training_configurations[0].model_dump(
                exclude_none=True
            ) == expected_training_configuration.model_dump(exclude_none=True)

            # map backward
            legacy_global_configuration, legacy_task_chain_configurations = (
                ConfigurationsBackwardCompatibility.backward_mapping(
                    project_identifier=fxt_project_identifier,
                    project_configuration=project_configuration,
                    all_training_configurations=training_configurations,
                )
            )

            project_configuration, training_configurations = ConfigurationsBackwardCompatibility.forward_mapping(
                project_identifier=fxt_project_identifier,
                legacy_global_configuration=legacy_global_configuration,
                legacy_task_chain_configs=legacy_task_chain_configurations,
            )

            # check that it matches again after forward->backward->forward mapping
            assert len(training_configurations) == 1
            assert project_configuration.model_dump() == expected_project_configuration.model_dump()
            assert training_configurations[0].model_dump() == expected_training_configuration.model_dump()
