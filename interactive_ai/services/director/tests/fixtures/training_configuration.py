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
                    "default_value": False,
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
    fxt_training_configuration_task_level_rest_view,
    fxt_partial_training_configuration_manifest_level,
):
    # Full configuration combines task level and manifest level configurations
    yield {
        "task_id": str(fxt_partial_training_configuration_manifest_level.task_id),
        "model_manifest_id": (fxt_partial_training_configuration_manifest_level.model_manifest_id),
        "dataset_preparation": {
            "augmentation": {
                "random_resize_crop": [
                    {
                        "key": "enable",
                        "name": "Enable random resize crop",
                        "type": "bool",
                        "description": (
                            "Whether to apply random resize and crop to the image. "
                            "Note: this augmentation is not supported when Tiling algorithm is enabled."
                        ),
                        "value": True,
                        "default_value": True,
                    },
                    {
                        "key": "crop_ratio_range",
                        "name": "Crop resize ratio range",
                        "type": "array",
                        "description": (
                            "Range (min, max) of crop ratios to apply during resize crop operation. "
                            "Specifies the fraction of the original image dimensions to retain after cropping. "
                            "For example, (0.8, 1.0) will randomly crop between 80% and 100% of the original size. "
                            "Both values should be between 0.0 and 1.0."
                        ),
                        "value": [0.08, 1.0],
                        "default_value": [0.08, 1.0],
                    },
                    {
                        "key": "aspect_ratio_range",
                        "name": "Aspect ratio range",
                        "type": "array",
                        "description": (
                            "Range (min, max) of aspect ratios to apply during resize crop operation. "
                            "Aspect ratio is defined as width divided by height. "
                            "For example, (0.75, 1.33) allows the crop to have an aspect ratio between 3:4 and 4:3."
                        ),
                        "value": [0.75, 1.34],
                        "default_value": [0.75, 1.34],
                    },
                ],
                "random_affine": [
                    {
                        "key": "enable",
                        "name": "Enable random affine",
                        "type": "bool",
                        "description": ("Whether to apply random affine transformations to the image"),
                        "value": True,
                        "default_value": False,
                    },
                    {
                        "key": "max_rotate_degree",
                        "name": "Rotation degrees",
                        "type": "float",
                        "description": (
                            "Maximum rotation angle in degrees for affine transformation. "
                            "A random angle in the range [-max_rotate_degree, max_rotate_degree] will be applied. "
                            "For example, max_rotate_degree=10 allows up to ±10 degrees rotation."
                        ),
                        "value": 10.0,
                        "default_value": 10.0,
                        "min_value": 0.0,
                        "max_value": None,
                    },
                    {
                        "key": "max_translate_ratio",
                        "name": "Horizontal translation",
                        "type": "float",
                        "description": (
                            "Maximum translation as a fraction of image width or height. "
                            "A random translation in the range [-max_translate_ratio, max_translate_ratio] "
                            "will be applied along both axes. For example, 0.1 allows up to ±10% translation."
                        ),
                        "value": 0.1,
                        "default_value": 0.1,
                        "min_value": 0.0,
                        "max_value": 1.0,
                    },
                    {
                        "key": "scaling_ratio_range",
                        "name": "Scaling ratio range",
                        "type": "array",
                        "description": (
                            "Range (min, max) of scaling factors to apply during affine transformation. "
                            "Both values should be > 0.0. For example, (0.8, 1.2) will randomly scale the image "
                            "between 80% and 120% of its original size."
                        ),
                        "value": [0.5, 1.5],
                        "default_value": [0.5, 1.5],
                    },
                    {
                        "key": "max_shear_degree",
                        "name": "Maximum shear degree",
                        "type": "float",
                        "description": (
                            "Maximum absolute shear angle in degrees to apply during affine transformation. "
                            "A random shear in the range [-max_shear_degree, max_shear_degree] will be applied."
                        ),
                        "value": 2.0,
                        "default_value": 2.0,
                        "min_value": None,
                        "max_value": None,
                    },
                ],
                "random_horizontal_flip": [
                    {
                        "key": "enable",
                        "name": "Enable random horizontal flip",
                        "type": "bool",
                        "description": (
                            "Whether to apply random flip images horizontally along the vertical axis "
                            "(swap left and right)"
                        ),
                        "value": True,
                        "default_value": True,
                    },
                    {
                        "key": "probability",
                        "name": "Probability",
                        "type": "float",
                        "description": (
                            "Probability of applying horizontal flip. "
                            "A value of 0.5 means each image has a 50% chance to be flipped horizontally."
                        ),
                        "value": 0.5,
                        "default_value": 0.5,
                        "min_value": 0.0,
                        "max_value": 1.0,
                    },
                ],
                "random_vertical_flip": [
                    {
                        "key": "enable",
                        "name": "Enable random vertical flip",
                        "type": "bool",
                        "description": (
                            "Whether to apply random flip images vertically along the horizontal axis "
                            "(swap top and bottom)"
                        ),
                        "value": False,
                        "default_value": False,
                    },
                    {
                        "key": "probability",
                        "name": "Probability",
                        "type": "float",
                        "description": (
                            "Probability of applying vertical flip. "
                            "A value of 0.5 means each image has a 50% chance to be flipped vertically."
                        ),
                        "value": 0.5,
                        "default_value": 0.5,
                        "min_value": 0.0,
                        "max_value": 1.0,
                    },
                ],
                "color_jitter": [
                    {
                        "key": "enable",
                        "name": "Enable color jitter",
                        "type": "bool",
                        "description": ("Whether to apply random color jitter to the image"),
                        "value": False,
                        "default_value": False,
                    },
                    {
                        "key": "brightness",
                        "name": "Brightness range",
                        "type": "array",
                        "description": (
                            "Range (min, max) of brightness adjustment factors. "
                            "A random factor from this range will be multiplied with the image brightness. "
                            "For example, (0.8, 1.2) means brightness can be reduced by 20% or increased by 20%."
                        ),
                        "value": [0.875, 1.125],
                        "default_value": [0.875, 1.125],
                    },
                    {
                        "key": "contrast",
                        "name": "Contrast range",
                        "type": "array",
                        "description": (
                            "Range (min, max) of contrast adjustment factors. "
                            "A random factor from this range will be multiplied with the image contrast. "
                            "For example, (0.5, 1.5) means contrast can be halved or increased by up to 50%."
                        ),
                        "value": [0.5, 1.5],
                        "default_value": [0.5, 1.5],
                    },
                    {
                        "key": "saturation",
                        "name": "Saturation range",
                        "type": "array",
                        "description": (
                            "Range (min, max) of saturation adjustment factors. "
                            "A random factor from this range will be multiplied with the image saturation. "
                            "For example, (0.5, 1.5) means saturation can be halved or increased by up to 50%."
                        ),
                        "value": [0.5, 1.5],
                        "default_value": [0.5, 1.5],
                    },
                    {
                        "key": "hue",
                        "name": "Hue range",
                        "type": "array",
                        "description": (
                            "Range (min, max) of hue adjustment values. "
                            "A random value from this range will be added to the image hue. "
                            "For example, (-0.05, 0.05) means hue can be shifted by up to ±0.05."
                        ),
                        "value": [-0.05, 0.05],
                        "default_value": [-0.05, 0.05],
                    },
                    {
                        "key": "probability",
                        "name": "Probability",
                        "type": "float",
                        "description": (
                            "Probability of applying color jitter. "
                            "A value of 0.5 means each image has a 50% chance to be color jittered."
                        ),
                        "value": 0.5,
                        "default_value": 0.5,
                        "min_value": 0.0,
                        "max_value": 1.0,
                    },
                ],
                "gaussian_blur": [
                    {
                        "key": "enable",
                        "name": "Enable Gaussian blur",
                        "type": "bool",
                        "description": ("Whether to apply Gaussian blur to the image"),
                        "value": True,
                        "default_value": False,
                    },
                    {
                        "key": "kernel_size",
                        "name": "Kernel size",
                        "type": "int",
                        "description": (
                            "Size of the Gaussian kernel. Larger kernel sizes result in stronger blurring. "
                            "Must be a positive odd integer."
                        ),
                        "value": 5,
                        "default_value": 5,
                        "min_value": 0,
                        "max_value": None,
                    },
                    {
                        "key": "sigma",
                        "name": "Sigma range",
                        "type": "array",
                        "description": (
                            "Range (min, max) of sigma values for Gaussian blur. "
                            "Sigma controls the amount of blurring. "
                            "A random value from this range will be used for each image."
                        ),
                        "value": [0.1, 2.0],
                        "default_value": [0.1, 2.0],
                    },
                    {
                        "key": "probability",
                        "name": "Probability",
                        "type": "float",
                        "description": (
                            "Probability of applying Gaussian blur. "
                            "A value of 0.5 means each image has a 50% chance to be blurred."
                        ),
                        "value": 0.5,
                        "default_value": 0.5,
                        "min_value": 0.0,
                        "max_value": 1.0,
                    },
                ],
                "gaussian_noise": [
                    {
                        "key": "enable",
                        "name": "Enable Gaussian noise",
                        "type": "bool",
                        "description": ("Whether to apply Gaussian noise to the image"),
                        "value": False,
                        "default_value": False,
                    },
                    {
                        "key": "mean",
                        "name": "Mean",
                        "type": "float",
                        "description": (
                            "Mean of the Gaussian noise to be added to the image. "
                            "Typically set to 0.0 for zero-mean noise."
                        ),
                        "value": 0.0,
                        "default_value": 0.0,
                        "min_value": None,
                        "max_value": None,
                    },
                    {
                        "key": "sigma",
                        "name": "Standard deviation",
                        "type": "float",
                        "description": (
                            "Standard deviation of the Gaussian noise. Controls the intensity of the noise. "
                            "Higher values result in noisier images."
                        ),
                        "value": 0.1,
                        "default_value": 0.1,
                        "min_value": 0.0,
                        "max_value": None,
                    },
                    {
                        "key": "probability",
                        "name": "Probability",
                        "type": "float",
                        "description": (
                            "Probability of applying Gaussian noise. "
                            "A value of 0.5 means each image has a 50% chance to have noise added."
                        ),
                        "value": 0.5,
                        "default_value": 0.5,
                        "min_value": 0.0,
                        "max_value": 1.0,
                    },
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
                    "default_value": False,
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
                    "description": ("Total size of the dataset (read-only parameter, not configurable by users)"),
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
                "description": (
                    "Width dimension in pixels for model input images. "
                    "Determines the horizontal resolution at which images are processed."
                ),
                "value": 64,
                "default_value": 224,
                "allowed_values": [64, 128, 224, 256, 320, 384, 480, 560],
            },
            {
                "key": "input_size_height",
                "name": "Input size height",
                "type": "enum",
                "description": (
                    "Height dimension in pixels for model input images. "
                    "Determines the vertical resolution at which images are processed."
                ),
                "value": 64,
                "default_value": 224,
                "allowed_values": [64, 128, 224, 256, 320, 384, 480, 560],
            },
            {
                "early_stopping": [
                    {
                        "default_value": True,
                        "description": ("Whether to stop training early when performance stops improving"),
                        "key": "enable",
                        "name": "Enable early stopping",
                        "type": "bool",
                        "value": True,
                    },
                    {
                        "default_value": 7,
                        "description": ("Number of epochs with no improvement after which training will be stopped"),
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
