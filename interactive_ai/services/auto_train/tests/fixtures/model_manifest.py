# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import pytest
from geti_configuration_tools.hyperparameters import (
    AugmentationParameters,
    DatasetPreparationParameters,
    EarlyStopping,
    EvaluationParameters,
    Hyperparameters,
    TrainingHyperParameters,
)
from geti_supported_models.model_manifest import Capabilities, GPUMaker, ModelManifest, ModelStats, PerformanceRatings


@pytest.fixture
def fxt_dummy_model_stats():
    yield ModelStats(
        gigaflops=0.39,
        trainable_parameters=5288548,
        performance_ratings=PerformanceRatings(
            accuracy=1,
            training_time=2,
            inference_speed=3,
        ),
    )


@pytest.fixture
def fxt_dummy_supported_gpu():
    yield {GPUMaker.INTEL: True, GPUMaker.NVIDIA: True}


@pytest.fixture
def fxt_dummy_hyperparameters():
    yield Hyperparameters(
        dataset_preparation=DatasetPreparationParameters(augmentation=AugmentationParameters()),
        training=TrainingHyperParameters(max_epochs=101, learning_rate=0.05, early_stopping=EarlyStopping(patience=5)),
        evaluation=EvaluationParameters(metric=None),
    )


@pytest.fixture
def fxt_dummy_model_manifest(fxt_dummy_model_stats, fxt_dummy_supported_gpu, fxt_dummy_hyperparameters):
    yield ModelManifest(
        id="dummy_model_manifest",
        name="Dummy ModelManifest",
        description="Dummy manifest for test purposes only",
        task="classification",
        stats=fxt_dummy_model_stats,
        supported_gpus=fxt_dummy_supported_gpu,
        hyperparameters=fxt_dummy_hyperparameters,
        capabilities=Capabilities(xai=True, tiling=False),
    )
