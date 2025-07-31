# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import pytest
from geti_configuration_tools.hyperparameters import (
    AugmentationParameters,
    DatasetPreparationParameters,
    EarlyStopping,
    EvaluationParameters,
    Hyperparameters,
    RandomAffine,
    TrainingHyperParameters,
)
from geti_configuration_tools.training_configuration import (
    Filtering,
    GlobalDatasetPreparationParameters,
    GlobalParameters,
    MaxAnnotationObjects,
    MaxAnnotationPixels,
    MinAnnotationObjects,
    MinAnnotationPixels,
    PartialTrainingConfiguration,
    SubsetSplit,
    TrainingConfiguration,
)


@pytest.fixture
def fxt_active_model_manifest_id():
    return "Custom_Image_Classification_EfficientNet-B3"


@pytest.fixture(scope="session")
def ftx_hyperparameters():
    yield Hyperparameters(
        dataset_preparation=DatasetPreparationParameters(
            augmentation=AugmentationParameters(
                random_affine=RandomAffine(enable=True),
            )
        ),
        training=TrainingHyperParameters(
            max_epochs=100,
            early_stopping=EarlyStopping(enable=True, patience=10),
            learning_rate=0.001,
        ),
        evaluation=EvaluationParameters(),
    )


@pytest.fixture
def fxt_global_parameters():
    yield GlobalParameters(
        dataset_preparation=GlobalDatasetPreparationParameters(
            subset_split=SubsetSplit(
                training=70,
                validation=20,
                test=10,
                auto_selection=True,
                remixing=False,
                dataset_size=256,  # This is a read-only parameter, not configurable by users
            ),
            filtering=Filtering(
                min_annotation_pixels=MinAnnotationPixels(enable=True, min_annotation_pixels=10),
                max_annotation_pixels=MaxAnnotationPixels(enable=True, max_annotation_pixels=1000),
                min_annotation_objects=MinAnnotationObjects(enable=True, min_annotation_objects=5),
                max_annotation_objects=MaxAnnotationObjects(enable=True, max_annotation_objects=100),
            ),
        )
    )


@pytest.fixture
def fxt_training_configuration_task_level(fxt_mongo_id, fxt_global_parameters, ftx_hyperparameters):
    yield TrainingConfiguration(
        id_=fxt_mongo_id(11),
        task_id=str(fxt_mongo_id(22)),
        global_parameters=fxt_global_parameters,
        hyperparameters=ftx_hyperparameters,
    )


@pytest.fixture
def fxt_training_configuration_task_level_rest_view(fxt_training_configuration_task_level):
    yield {
        "task_id": str(fxt_training_configuration_task_level.task_id),
        "dataset_preparation": {
            "augmentation": {
                "random_affine": [
                    {
                        "default_value": False,
                        "description": "Whether to apply random affine transformations to the image",
                        "key": "enable",
                        "name": "Enable random affine",
                        "type": "bool",
                        "value": True,
                    },
                ]
            },
            "filtering": {
                "max_annotation_objects": [
                    {
                        "default_value": False,
                        "description": "Whether to apply maximum annotation objects filtering",
                        "key": "enable",
                        "name": "Enable maximum annotation objects filtering",
                        "type": "bool",
                        "value": True,
                    },
                    {
                        "default_value": 10000,
                        "description": "Maximum number of objects in an annotation",
                        "key": "max_annotation_objects",
                        "max_value": None,
                        "min_value": 0,
                        "name": "Maximum annotation objects",
                        "type": "int",
                        "value": 100,
                    },
                ],
                "max_annotation_pixels": [
                    {
                        "default_value": False,
                        "description": "Whether to apply maximum annotation pixels filtering",
                        "key": "enable",
                        "name": "Enable maximum annotation pixels filtering",
                        "type": "bool",
                        "value": True,
                    },
                    {
                        "default_value": 10000,
                        "description": "Maximum number of pixels in an annotation",
                        "key": "max_annotation_pixels",
                        "max_value": None,
                        "min_value": 0,
                        "name": "Maximum annotation pixels",
                        "type": "int",
                        "value": 1000,
                    },
                ],
                "min_annotation_pixels": [
                    {
                        "default_value": False,
                        "description": "Whether to apply minimum annotation pixels filtering",
                        "key": "enable",
                        "name": "Enable minimum annotation pixels filtering",
                        "type": "bool",
                        "value": True,
                    },
                    {
                        "default_value": 1,
                        "description": "Minimum number of pixels in an annotation",
                        "key": "min_annotation_pixels",
                        "max_value": 200000000,
                        "min_value": 0,
                        "name": "Minimum annotation pixels",
                        "type": "int",
                        "value": 10,
                    },
                ],
                "min_annotation_objects": [
                    {
                        "default_value": False,
                        "description": "Whether to apply minimum annotation objects filtering",
                        "key": "enable",
                        "name": "Enable minimum annotation objects filtering",
                        "type": "bool",
                        "value": True,
                    },
                    {
                        "default_value": 1,
                        "description": "Minimum number of objects in an annotation",
                        "key": "min_annotation_objects",
                        "max_value": None,
                        "min_value": 0,
                        "name": "Minimum annotation objects",
                        "type": "int",
                        "value": 5,
                    },
                ],
            },
            "subset_split": [
                {
                    "default_value": 70,
                    "description": "Percentage of data to use for training",
                    "key": "training",
                    "max_value": 100,
                    "min_value": 1,
                    "name": "Training percentage",
                    "type": "int",
                    "value": 70,
                },
                {
                    "default_value": 20,
                    "description": "Percentage of data to use for validation",
                    "key": "validation",
                    "max_value": 100,
                    "min_value": 1,
                    "name": "Validation percentage",
                    "type": "int",
                    "value": 20,
                },
                {
                    "default_value": 10,
                    "description": "Percentage of data to use for testing",
                    "key": "test",
                    "max_value": 100,
                    "min_value": 1,
                    "name": "Test percentage",
                    "type": "int",
                    "value": 10,
                },
                {
                    "default_value": True,
                    "description": "Whether to automatically select data for each subset",
                    "key": "auto_selection",
                    "name": "Auto selection",
                    "type": "bool",
                    "value": True,
                },
                {
                    "default_value": False,
                    "description": "Whether to remix data between subsets",
                    "key": "remixing",
                    "name": "Remixing",
                    "type": "bool",
                    "value": False,
                },
                {
                    "default_value": None,
                    "description": "Total size of the dataset (read-only parameter, not configurable by users)",
                    "key": "dataset_size",
                    "max_value": None,
                    "min_value": 0,
                    "name": "Dataset size",
                    "type": "int",
                    "value": 256,
                },
            ],
        },
        "training": [
            {
                "default_value": None,
                "description": "Maximum number of training epochs to run",
                "key": "max_epochs",
                "max_value": None,
                "min_value": 0,
                "name": "Maximum epochs",
                "type": "int",
                "value": 100,
            },
            {
                "default_value": None,
                "description": "Base learning rate for the optimizer",
                "key": "learning_rate",
                "max_value": 1.0,
                "min_value": 0.0,
                "name": "Learning rate",
                "type": "float",
                "value": 0.001,
            },
            {
                "early_stopping": [
                    {
                        "default_value": False,
                        "description": "Whether to stop training early when performance stops improving",
                        "key": "enable",
                        "name": "Enable early stopping",
                        "type": "bool",
                        "value": True,
                    },
                    {
                        "default_value": 1,
                        "description": "Number of epochs with no improvement after which training will be stopped",
                        "key": "patience",
                        "max_value": None,
                        "min_value": 0,
                        "name": "Patience",
                        "type": "int",
                        "value": 10,
                    },
                ],
            },
        ],
        "evaluation": [],
    }


@pytest.fixture
def fxt_partial_training_configuration_manifest_level(fxt_mongo_id, fxt_active_model_manifest_id):
    # Manifest level configuration contains parameters related to a model architecture
    # if there is a conflict with task level configuration, manifest level configuration takes precedence
    partial_config_dict = {
        "id_": fxt_mongo_id(12),
        "task_id": fxt_mongo_id(22),
        "model_manifest_id": fxt_active_model_manifest_id,
        "global_parameters": {
            "dataset_preparation": {
                "subset_split": {
                    "training": 80,
                    "validation": 10,
                    "test": 10,
                    "dataset_size": 256,  # Note: this is a read-only parameter, not configurable by users
                }
            }
        },
        "hyperparameters": {
            "dataset_preparation": {
                "augmentation": {
                    "gaussian_blur": {
                        "enable": True,
                    },
                    "random_affine": {
                        "enable": True,
                    },
                },
            },
            "training": {
                "max_epochs": 50,
                "learning_rate": 0.05,
                "input_size_width": 64,
                "input_size_height": 64,
                "allowed_values_input_size": [64, 128, 224, 256, 320, 384, 480, 560],
            },
        },
    }
    yield PartialTrainingConfiguration.model_validate(partial_config_dict)


@pytest.fixture
def fxt_training_configuration_full_rest_view(
    fxt_training_configuration_task_level_rest_view, fxt_partial_training_configuration_manifest_level
):
    # Full configuration combines task level and manifest level configurations
    yield {
        "task_id": str(fxt_partial_training_configuration_manifest_level.task_id),
        "model_manifest_id": fxt_partial_training_configuration_manifest_level.model_manifest_id,
        "dataset_preparation": {
            "augmentation": {
                "color_jitter": [
                    {
                        "default_value": False,
                        "description": "Whether to apply random color jitter to the image",
                        "key": "enable",
                        "name": "Enable color jitter",
                        "type": "bool",
                        "value": False,
                    },
                ],
                "gaussian_blur": [
                    {
                        "default_value": False,
                        "description": "Whether to apply Gaussian blur to the image",
                        "key": "enable",
                        "name": "Enable Gaussian blur",
                        "type": "bool",
                        "value": True,
                    },
                ],
                "random_horizontal_flip": [
                    {
                        "default_value": True,
                        "description": "Whether to apply random flip images horizontally along the vertical axis "
                        "(swap left and right)",
                        "key": "enable",
                        "name": "Enable random horizontal flip",
                        "type": "bool",
                        "value": True,
                    },
                ],
                "random_vertical_flip": [
                    {
                        "default_value": False,
                        "description": "Whether to apply random flip images vertically along the horizontal axis "
                        "(swap top and bottom)",
                        "key": "enable",
                        "name": "Enable random vertical flip",
                        "type": "bool",
                        "value": False,
                    },
                ],
                "random_affine": [
                    {
                        "default_value": False,
                        "description": "Whether to apply random affine transformations to the image",
                        "key": "enable",
                        "name": "Enable random affine",
                        "type": "bool",
                        "value": True,
                    }
                ],
            },
            "filtering": {
                "max_annotation_objects": [
                    {
                        "default_value": False,
                        "description": "Whether to apply maximum annotation objects filtering",
                        "key": "enable",
                        "name": "Enable maximum annotation objects filtering",
                        "type": "bool",
                        "value": True,
                    },
                    {
                        "default_value": 10000,
                        "description": "Maximum number of objects in an annotation",
                        "key": "max_annotation_objects",
                        "max_value": None,
                        "min_value": 0,
                        "name": "Maximum annotation objects",
                        "type": "int",
                        "value": 100,
                    },
                ],
                "max_annotation_pixels": [
                    {
                        "default_value": False,
                        "description": "Whether to apply maximum annotation pixels filtering",
                        "key": "enable",
                        "name": "Enable maximum annotation pixels filtering",
                        "type": "bool",
                        "value": True,
                    },
                    {
                        "default_value": 10000,
                        "description": "Maximum number of pixels in an annotation",
                        "key": "max_annotation_pixels",
                        "max_value": None,
                        "min_value": 0,
                        "name": "Maximum annotation pixels",
                        "type": "int",
                        "value": 1000,
                    },
                ],
                "min_annotation_pixels": [
                    {
                        "default_value": False,
                        "description": "Whether to apply minimum annotation pixels filtering",
                        "key": "enable",
                        "name": "Enable minimum annotation pixels filtering",
                        "type": "bool",
                        "value": True,
                    },
                    {
                        "default_value": 1,
                        "description": "Minimum number of pixels in an annotation",
                        "key": "min_annotation_pixels",
                        "max_value": 200000000,
                        "min_value": 0,
                        "name": "Minimum annotation pixels",
                        "type": "int",
                        "value": 10,
                    },
                ],
                "min_annotation_objects": [
                    {
                        "default_value": False,
                        "description": "Whether to apply minimum annotation objects filtering",
                        "key": "enable",
                        "name": "Enable minimum annotation objects filtering",
                        "type": "bool",
                        "value": True,
                    },
                    {
                        "default_value": 1,
                        "description": "Minimum number of objects in an annotation",
                        "key": "min_annotation_objects",
                        "max_value": None,
                        "min_value": 0,
                        "name": "Minimum annotation objects",
                        "type": "int",
                        "value": 5,
                    },
                ],
            },
            "subset_split": [
                {
                    "default_value": 70,
                    "description": "Percentage of data to use for training",
                    "key": "training",
                    "max_value": 100,
                    "min_value": 1,
                    "name": "Training percentage",
                    "type": "int",
                    "value": 80,
                },
                {
                    "default_value": 20,
                    "description": "Percentage of data to use for validation",
                    "key": "validation",
                    "max_value": 100,
                    "min_value": 1,
                    "name": "Validation percentage",
                    "type": "int",
                    "value": 10,
                },
                {
                    "default_value": 10,
                    "description": "Percentage of data to use for testing",
                    "key": "test",
                    "max_value": 100,
                    "min_value": 1,
                    "name": "Test percentage",
                    "type": "int",
                    "value": 10,
                },
                {
                    "default_value": True,
                    "description": "Whether to automatically select data for each subset",
                    "key": "auto_selection",
                    "name": "Auto selection",
                    "type": "bool",
                    "value": True,
                },
                {
                    "default_value": False,
                    "description": "Whether to remix data between subsets",
                    "key": "remixing",
                    "name": "Remixing",
                    "type": "bool",
                    "value": False,
                },
                {
                    "default_value": None,
                    "description": "Total size of the dataset (read-only parameter, not configurable by users)",
                    "key": "dataset_size",
                    "max_value": None,
                    "min_value": 0,
                    "name": "Dataset size",
                    "type": "int",
                    "value": 256,
                },
            ],
        },
        "training": [
            {
                "default_value": 90,
                "description": "Maximum number of training epochs to run",
                "key": "max_epochs",
                "max_value": None,
                "min_value": 0,
                "name": "Maximum epochs",
                "type": "int",
                "value": 50,
            },
            {
                "default_value": 0.01,
                "description": "Base learning rate for the optimizer",
                "key": "learning_rate",
                "max_value": 1.0,
                "min_value": 0.0,
                "name": "Learning rate",
                "type": "float",
                "value": 0.05,
            },
            {
                "key": "input_size_width",
                "name": "Input size width",
                "type": "enum",
                "description": "Width dimension in pixels for model input images. "
                "Determines the horizontal resolution at which images are processed.",
                "value": 64,
                "default_value": 224,
                "allowed_values": [64, 128, 224, 256, 320, 384, 480, 560],
            },
            {
                "key": "input_size_height",
                "name": "Input size height",
                "type": "enum",
                "description": "Height dimension in pixels for model input images. "
                "Determines the vertical resolution at which images are processed.",
                "value": 64,
                "default_value": 224,
                "allowed_values": [64, 128, 224, 256, 320, 384, 480, 560],
            },
            {
                "early_stopping": [
                    {
                        "default_value": True,
                        "description": "Whether to stop training early when performance stops improving",
                        "key": "enable",
                        "name": "Enable early stopping",
                        "type": "bool",
                        "value": True,
                    },
                    {
                        "default_value": 7,
                        "description": "Number of epochs with no improvement after which training will be stopped",
                        "key": "patience",
                        "max_value": None,
                        "min_value": 0,
                        "name": "Patience",
                        "type": "int",
                        "value": 10,
                    },
                ],
            },
        ],
        "evaluation": [],
    }
