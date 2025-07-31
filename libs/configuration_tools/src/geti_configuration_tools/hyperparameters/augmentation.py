# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

from pydantic import Field

from .base_model_no_extra import BaseModelNoExtra


class CenterCrop(BaseModelNoExtra):
    enable: bool = Field(
        default=False,
        title="Enable center crop",
        description="Whether to apply center cropping to the image",
    )
    # Exclude fields as they are supported yet by OTX
    ratio: float | None = Field(
        gt=0.0,
        default=None,
        title="Crop ratio",
        description="Ratio of original dimensions to keep when cropping",
        exclude=True,
    )


class RandomResizeCrop(BaseModelNoExtra):
    enable: bool = Field(
        default=False,
        title="Enable random resize crop",
        description="Whether to apply random resize and crop to the image",
    )
    # Exclude fields as they are supported yet by OTX
    ratio: float | None = Field(
        gt=0.0,
        default=None,
        title="Crop resize ratio",
        description="Ratio of original dimensions to apply during resize crop operation",
        exclude=True,
    )


class RandomAffine(BaseModelNoExtra):
    enable: bool = Field(
        default=False,
        title="Enable random affine",
        description="Whether to apply random affine transformations to the image",
    )
    # Exclude fields as they are supported yet by OTX
    degrees: float | None = Field(
        ge=0.0,
        default=None,
        title="Rotation degrees",
        description="Maximum rotation angle in degrees",
        exclude=True,
    )
    translate_x: float | None = Field(
        default=None,
        ge=0.0,
        lt=1.0,
        title="Horizontal translation",
        description="Maximum horizontal translation as a fraction of image width",
        exclude=True,
    )
    translate_y: float | None = Field(
        default=None,
        ge=0.0,
        lt=1.0,
        title="Vertical translation",
        description="Maximum vertical translation as a fraction of image height",
        exclude=True,
    )
    scale: float | None = Field(
        default=None,
        title="Scale factor",
        description="Scaling factor for the image during affine transformation",
        exclude=True,
    )


class RandomHorizontalFlip(BaseModelNoExtra):
    enable: bool = Field(
        default=False,
        title="Enable random horizontal flip",
        description="Whether to apply random flip images horizontally along the vertical axis (swap left and right)",
    )


class RandomVerticalFlip(BaseModelNoExtra):
    enable: bool = Field(
        default=False,
        title="Enable random vertical flip",
        description="Whether to apply random flip images vertically along the horizontal axis (swap top and bottom)",
    )


class RandomIOUCrop(BaseModelNoExtra):
    enable: bool = Field(
        default=False,
        title="Enable random IoU crop",
        description="Whether to apply random cropping based on IoU criteria",
    )


class ColorJitter(BaseModelNoExtra):
    enable: bool = Field(
        default=False,
        title="Enable color jitter",
        description="Whether to apply random color jitter to the image",
    )


class GaussianBlur(BaseModelNoExtra):
    enable: bool = Field(
        default=False,
        title="Enable Gaussian blur",
        description="Whether to apply Gaussian blur to the image",
    )
    # Exclude fields as they are supported yet by OTX
    kernel_size: int | None = Field(
        gt=0,
        default=None,
        title="Kernel size",
        description="Size of the Gaussian kernel",
        exclude=True,
    )


class Tiling(BaseModelNoExtra):
    enable: bool = Field(
        default=False,
        title="Enable tiling",
        description="Whether to apply tiling to the image",
    )
    adaptive_tiling: bool = Field(
        default=False, title="Adaptive tiling", description="Whether to use adaptive tiling based on image content"
    )
    tile_size: int = Field(gt=0, default=128, title="Tile size", description="Size of each tile in pixels")
    tile_overlap: float = Field(
        ge=0.0,
        lt=1.0,
        default=0.5,
        title="Tile overlap",
        description="Overlap between adjacent tiles as a fraction of tile size",
    )


class AugmentationParameters(BaseModelNoExtra):
    """Configuration parameters for data augmentation during training."""

    center_crop: CenterCrop | None = Field(
        default=None, title="Center crop", description="Settings for center cropping images"
    )
    random_resize_crop: RandomResizeCrop | None = Field(
        default=None, title="Random resize crop", description="Settings for random resize and crop augmentation"
    )
    random_affine: RandomAffine | None = Field(
        default=None, title="Random affine", description="Settings for random affine transformations"
    )
    random_horizontal_flip: RandomHorizontalFlip | None = Field(
        default=None,
        title="Random horizontal flip",
        description="Randomly flip images horizontally along the vertical axis (swap left and right)",
    )
    random_vertical_flip: RandomVerticalFlip | None = Field(
        default=None,
        title="Random vertical flip",
        description="Randomly flip images vertically along the horizontal axis (swap top and bottom)",
    )
    random_iou_crop: RandomIOUCrop | None = Field(
        default=None,
        title="Random IoU crop",
        description="Randomly crop images based on Intersection over Union (IoU) criteria",
    )
    color_jitter: ColorJitter | None = Field(
        default=None,
        title="Color jitter",
        description="Settings for random color jitter (brightness, contrast, saturation, hue)",
    )
    gaussian_blur: GaussianBlur | None = Field(
        default=None, title="Gaussian blur", description="Settings for Gaussian blur augmentation"
    )
    tiling: Tiling | None = Field(default=None, title="Tiling", description="Settings for image tiling")
