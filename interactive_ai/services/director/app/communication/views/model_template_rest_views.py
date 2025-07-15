# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from geti_feature_tools import FeatureFlagProvider
from geti_supported_models import SupportedModels

from features.feature_flag import FeatureFlag

from iai_core.entities.model_template import ModelTemplate

APPLICATION = "application"
CAPABILITIES = "capabilities"
CLASSES = "classes"
DATASET_REQUIRMENTS = "dataset_requirments"
FRAMEWORK = "framework"
INPUT_PORTS = "input_ports"
INSTANTIATION = "instantiation"
IS_TRAINABLE = "is_trainable"
MAX_NODES = "max_nodes"
MODEL_OPTIMIZATION_METHODS = "model_optimization_methods"
MODEL_TEMPLATE_ID = "model_template_id"
NAME = "name"
OUTPUT_PORTS = "output_ports"
PIPELINE_FRIENDLY = "pipeline_friendly"
PORT_DICT = {"port_name": "0", "type": "DATASET_2D"}
PROPERTIES = "properties"
SUMMARY = "summary"
TASK_FAMILY = "task_family"
TASK_NAME = "task_name"
TASK_TYPE = "task_type"
TASK_TYPE_SORT_PRIORITY = "task_type_sort_priority"


class ModelTemplateRESTViews:
    @staticmethod
    def model_template_to_rest(model_template: ModelTemplate) -> dict:
        """
        Convert a ModelTemplate to a dict representation. Note that a ModelTemplate corresponds to an algorithm.

        :param model_template: Model template to convert
        :return: Dict representation of the model template
        """
        if FeatureFlagProvider.is_enabled(FeatureFlag.FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS):
            model_manifest = SupportedModels.get_model_manifest_by_id(model_template.model_manifest_id)
            model_manifest_dict = model_manifest.model_dump()
            return {
                "model_manifest_id": model_manifest.id,
                "task": model_manifest.task,
                "name": model_manifest.name,
                "description": model_manifest.description,
                "stats": model_manifest_dict["stats"],
                "support_status": model_manifest.support_status.name.lower(),
                "supported_gpus": model_manifest_dict["supported_gpus"],
                "capabilities": model_manifest_dict["capabilities"],
                "is_default_model": model_manifest.is_default_model,
                "performance_category": model_manifest.model_category or "other",
            }
        return {
            "name": model_template.name,
            "task_type": model_template.task_type.name.lower(),
            "model_size": model_template.size,
            "model_template_id": model_template.model_template_id,
            "gigaflops": model_template.gigaflops,
            "summary": model_template.summary,
            "supports_auto_hpo": False,  # legacy; kept for backward-compatibility
            "default_algorithm": model_template.is_default_for_task,
            "performance_category": model_template.model_category.name.lower(),
            "lifecycle_stage": model_template.model_status.name.lower(),
        }
