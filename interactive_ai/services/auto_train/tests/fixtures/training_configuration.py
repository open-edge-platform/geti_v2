# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import pytest
from geti_configuration_tools.training_configuration import PartialTrainingConfiguration


@pytest.fixture
def fxt_training_configuration_task_level(fxt_mongo_id):
    yield PartialTrainingConfiguration.model_validate(
        {
            "id_": fxt_mongo_id(1),
            "task_id": "task_123",
            "global_parameters": {
                "dataset_preparation": {
                    "filtering": {
                        "min_annotation_pixels": {
                            "enable": True,
                            "min_annotation_pixels": 256,
                        },
                        "max_annotation_pixels": {
                            "enable": False,
                            "max_annotation_pixels": 1000,
                        },
                        "max_annotation_objects": {
                            "enable": True,
                            "max_annotation_objects": 100,
                        },
                    }
                },
            },
        }
    )


@pytest.fixture
def fxt_training_configuration_model_manifest_level(fxt_mongo_id):
    yield PartialTrainingConfiguration.model_validate(
        {
            "id_": fxt_mongo_id(2),
            "task_id": "task_123",
            "model_manifest_id": "model_manifest_456",
            "global_parameters": {
                "dataset_preparation": {
                    "filtering": {
                        "min_annotation_pixels": {
                            "enable": True,
                            "min_annotation_pixels": 512,
                        },
                    }
                },
            },
        }
    )
