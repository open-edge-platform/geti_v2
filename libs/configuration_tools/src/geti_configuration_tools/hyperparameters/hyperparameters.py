# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from pydantic import BaseModel, Field, model_validator

from geti_configuration_tools.utils import partial_model

from .augmentation import AugmentationParameters


class DatasetPreparationParameters(BaseModel):
    """Parameters for dataset preparation before training."""

    augmentation: AugmentationParameters


class EarlyStopping(BaseModel):
    enable: bool = Field(
        default=False,
        title="Enable early stopping",
        description="Whether to stop training early when performance stops improving",
    )
    patience: int = Field(
        gt=0,
        default=1,
        title="Patience",
        description="Number of epochs with no improvement after which training will be stopped",
    )


class MaxDetectionPerImage(BaseModel):
    enable: bool = Field(
        default=False,
        title="Enable maximum detection per image",
        description="Whether to limit the number of detections per image",
    )
    max_detection_per_image: int = Field(
        default=10000,
        gt=0,
        title="Maximum number of detections per image",
        description=(
            "Maximum number of objects that can be detected in a single image, "
            "only applicable for instance segmentation models"
        ),
    )


class TrainingHyperParameters(BaseModel):
    """Hyperparameters for model training process."""

    max_epochs: int = Field(
        gt=0, default=1000, title="Maximum epochs", description="Maximum number of training epochs to run"
    )
    early_stopping: EarlyStopping = Field(
        default_factory=EarlyStopping, title="Early stopping", description="Configuration for early stopping mechanism"
    )
    learning_rate: float = Field(
        gt=0, lt=1, default=0.001, title="Learning rate", description="Base learning rate for the optimizer"
    )
    max_detection_per_image: MaxDetectionPerImage | None = Field(
        default_factory=MaxDetectionPerImage,
        title="Maximum number of detections per image",
        description=(
            "Maximum number of objects that can be detected in a single image, "
            "only applicable for instance segmentation models"
        ),
    )
    input_size: str | None = Field(
        default=None,
        title="Input size",
        description=(
            "Width and height dimensions for model input images in 'WxH' format (e.g., '512x512'). "
            "Determines the resolution at which images are processed by the model."
        ),
        json_schema_extra={},
    )
    allowed_values_input_size: list[str] | None = Field(
        default=None,
        title="Supported input sizes",
        description=(
            "List of supported input sizes for the model in 'WxH' format (e.g., ['512x512', '640x640']). "
            "Only these dimensions will be accepted."
        ),
        json_schema_extra={"validation_only": True},
    )

    @model_validator(mode="after")
    def validate_input_size(self) -> "TrainingHyperParameters":
        # skip validation if not set
        if self.input_size is None:
            return self

        # validate format is 'WxH' (e.g. '512x512')
        try:
            w, h, *_bin = str(self.input_size).split("x")
            input_size = f"{int(w)}x{int(h)}"
        except ValueError:
            raise ValueError(f"Input size '{self.input_size}' is not in the expected format 'WxH' (e.g. '512x512')")

        # validate against allowed input sizes if available
        if self.allowed_values_input_size and input_size not in self.allowed_values_input_size:
            raise ValueError(
                f"Input size '{input_size}' is not in the list of supported input sizes: "
                f"{self.allowed_values_input_size}"
            )

        # Update the model's json_schema to include allowed values for input_size
        # Note: existing json_schema_extra cannot be overwritten, otherwise it will absent from model_json_schema()
        self.model_fields["input_size"].json_schema_extra.update(  # type: ignore[union-attr]
            {
                "allowed_values": self.allowed_values_input_size,  # type:ignore[dict-item]
                "default_value": input_size,
            }
        )
        return self


class EvaluationParameters(BaseModel):
    """Parameters for model evaluation."""

    metric: None = Field(
        default=None, title="Evaluation metric", description="Metric used to evaluate model performance"
    )


class Hyperparameters(BaseModel):
    """Complete set of configurable parameters for model training and evaluation."""

    dataset_preparation: DatasetPreparationParameters
    training: TrainingHyperParameters
    evaluation: EvaluationParameters


@partial_model
class PartialHyperparameters(Hyperparameters):
    """
    A partial version of `Hyperparameters` with all fields optional.

    Enables flexible updates and partial validation, making it suitable for scenarios
    where only a subset of the configuration needs to be specified or changed.
    """
