# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from geti_configuration_tools.hyperparameters import (
    AugmentationParameters,
    DatasetPreparationParameters,
    EarlyStopping,
    EvaluationParameters,
    Hyperparameters,
    Tiling,
    TrainingHyperParameters,
)
from iai_core.configuration.elements.configurable_parameters import ConfigurableParameters
from iai_core.configuration.interfaces import IConfigurableParameterContainer


def forward_legacy_hyperparameters(  # noqa: C901
    legacy_hyperparams: IConfigurableParameterContainer | ConfigurableParameters,
) -> Hyperparameters:
    """Convert legacy hyperparameters to new format"""
    # Create tiling parameters if enabled
    tiling = None
    if legacy_tiling := getattr(legacy_hyperparams, "tiling_parameters", None):
        tile_size = legacy_tiling.tile_size
        adaptive = getattr(legacy_tiling, "enable_adaptive_tiling", None) or getattr(
            legacy_tiling, "enable_adaptive_params", None
        )
        tiling = Tiling(
            enable=legacy_tiling.enable_tiling,
            adaptive_tiling=adaptive,
            tile_size=tile_size,
            tile_overlap=int(legacy_tiling.tile_overlap * tile_size) if tile_size > 0 else 0,
        )

    # Create augmentation parameters
    augmentation = AugmentationParameters(tiling=tiling)

    # Create training hyperparameters
    # Check if legacy_hyperparams has learning_parameters before accessing
    legacy_learning_parameters = getattr(legacy_hyperparams, "learning_parameters", None)
    early_stopping = None

    if legacy_learning_parameters and hasattr(legacy_learning_parameters, "enable_early_stopping"):
        early_stopping_enabled = getattr(legacy_learning_parameters, "enable_early_stopping", False)
        if early_stopping_enabled and hasattr(legacy_learning_parameters, "early_stop_patience"):
            early_stopping = getattr(legacy_learning_parameters, "early_stop_patience")
    # Anomaly tasks have difference structure
    elif legacy_learning_parameters and hasattr(legacy_learning_parameters, "early_stopping"):
        early_stopping_obj = getattr(legacy_learning_parameters, "early_stopping")
        if hasattr(early_stopping_obj, "patience"):
            early_stopping = early_stopping_obj.patience

    learning_rate = 0.001
    if legacy_learning_parameters:
        for alias in ["learning_rate", "lr"]:
            if hasattr(legacy_learning_parameters, alias):
                learning_rate = getattr(legacy_learning_parameters, alias)

    max_epochs = 1000
    if legacy_learning_parameters:
        for max_epochs_alias in ["num_iters", "max_epochs", "max_num_epochs"]:
            if hasattr(legacy_learning_parameters, max_epochs_alias):
                max_epochs = getattr(legacy_learning_parameters, max_epochs_alias)
                break

    training_params = TrainingHyperParameters(
        max_epochs=max_epochs,
        learning_rate=learning_rate,
        early_stopping=(EarlyStopping(enable=True, patience=early_stopping) if early_stopping else EarlyStopping()),
    )

    return Hyperparameters(
        dataset_preparation=DatasetPreparationParameters(augmentation=augmentation),
        training=training_params,
        evaluation=EvaluationParameters(),
    )
