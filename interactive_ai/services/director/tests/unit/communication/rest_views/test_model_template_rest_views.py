# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from unittest.mock import MagicMock

from geti_supported_models import SupportedModels
from testfixtures import compare

from communication.views.model_template_rest_views import ModelTemplateRESTViews
from features.feature_flag import FeatureFlag


class TestSCModelTemplateRESTViews:
    def test_model_template_to_rest(self, fxt_model_template_classification) -> None:
        expected_result = {
            "name": fxt_model_template_classification.name,
            "task_type": fxt_model_template_classification.task_type.name.lower(),
            "model_size": fxt_model_template_classification.size,
            "model_template_id": fxt_model_template_classification.model_template_id,
            "gigaflops": fxt_model_template_classification.gigaflops,
            "summary": fxt_model_template_classification.summary,
            "supports_auto_hpo": False,
            "default_algorithm": True,
            "performance_category": fxt_model_template_classification.model_category.name.lower(),
            "lifecycle_stage": fxt_model_template_classification.model_status.name.lower(),
        }

        result = ModelTemplateRESTViews.model_template_to_rest(model_template=fxt_model_template_classification)

        compare(result, expected_result, ignore_eq=True)

    def test_model_manifest_to_rest(self, fxt_enable_feature_flag_name) -> None:
        # Arrange
        fxt_enable_feature_flag_name(FeatureFlag.FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS.name)
        model_manifest = SupportedModels.get_model_manifest_by_id("Object_Detection_DFine_X")
        expected_result = {
            "model_manifest_id": model_manifest.id,
            "task": model_manifest.task.lower(),
            "name": model_manifest.name,
            "description": model_manifest.description,
            "stats": model_manifest.stats.model_dump(),
            "support_status": model_manifest.support_status.name.lower(),
            "supported_gpus": model_manifest.supported_gpus,
            "capabilities": model_manifest.capabilities.model_dump(),
            "is_default_model": model_manifest.is_default_model,
            "performance_category": model_manifest.model_category or "other",
        }
        mock_model_template = MagicMock()
        mock_model_template.model_manifest_id = model_manifest.id

        # Act
        rest_view = ModelTemplateRESTViews.model_template_to_rest(mock_model_template)

        # Assert
        assert rest_view == expected_result
