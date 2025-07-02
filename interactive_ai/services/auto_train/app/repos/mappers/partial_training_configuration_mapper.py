# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from geti_configuration_tools.training_configuration import PartialTrainingConfiguration

from iai_core.repos.mappers.mongodb_mapper_interface import IMapperBackward
from iai_core.repos.mappers.mongodb_mappers.id_mapper import IDToMongo


class PartialTrainingConfigurationToMongo(IMapperBackward[PartialTrainingConfiguration, dict]):
    """MongoDB mapper for `TrainingConfiguration` entities"""

    @staticmethod
    def backward(instance: dict) -> PartialTrainingConfiguration:
        partial_model_dict = {
            "id_": IDToMongo.backward(instance["_id"]),
            "task_id": IDToMongo.backward(instance["task_id"]),
            "model_manifest_id": instance.get("model_manifest_id"),
            "global_parameters": instance.get("global_parameters"),
            "hyperparameters": instance.get("hyperparameters"),
        }
        return PartialTrainingConfiguration.model_validate(partial_model_dict)
