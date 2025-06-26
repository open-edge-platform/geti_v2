# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from enum import Enum, auto


class DefaultType(str, Enum):
    """Model optimization preference categories.

    Defines the trade-off preference between accuracy and inference speed:
    - ACCURACY: Models optimized for highest prediction quality, potentially at the cost of speed
    - SPEED: Models optimized for fastest inference time, potentially at the cost of accuracy
    - BALANCE: Models that provide a balanced trade-off between accuracy and speed
    """

    ACCURACY = auto()
    SPEED = auto()
    BALANCE = auto()


class TaskType(str, Enum):
    CLASSIFICATION = auto()
    DETECTION = auto()
    ROTATED_DETECTION = auto()
    INSTANCE_SEGMENTATION = auto()
    SEMANTIC_SEGMENTATION = auto()
    ANOMALY = auto()
    KEYPOINT_DETECTION = auto()


class DefaultModels:
    """Provides the recommended model architectures for different computer vision tasks.

    This class maps task types to recommended model architectures based on optimization
    preferences (accuracy, speed, or balance), offering a curated selection of pre-configured
    models suitable for various computer vision applications.
    """

    default_models_by_task: dict[TaskType, dict[DefaultType, str | None]] = {
        TaskType.CLASSIFICATION: {
            DefaultType.ACCURACY: "Custom_Image_Classification_EfficientNet-V2-S",
            DefaultType.SPEED: "Custom_Image_Classification_MobileNet-V3-large-1x",
            DefaultType.BALANCE: "Custom_Image_Classification_EfficinetNet-B0",
        },
        TaskType.DETECTION: {
            DefaultType.ACCURACY: "Object_Detection_DFine_X",
            DefaultType.SPEED: "Object_Detection_YOLOX_S",
            DefaultType.BALANCE: "Custom_Object_Detection_Gen3_ATSS",
        },
        TaskType.ROTATED_DETECTION: {
            DefaultType.ACCURACY: "Custom_Rotated_Detection_via_Instance_Segmentation_MaskRCNN_ResNet50",
            DefaultType.SPEED: "Custom_Rotated_Detection_via_Instance_Segmentation_MaskRCNN_EfficientNetB2B",
            DefaultType.BALANCE: None,
        },
        TaskType.INSTANCE_SEGMENTATION: {
            DefaultType.ACCURACY: "Custom_Counting_Instance_Segmentation_MaskRCNN_SwinT_FP16",
            DefaultType.SPEED: "Custom_Counting_Instance_Segmentation_MaskRCNN_EfficientNetB2B",
            DefaultType.BALANCE: "Custom_Instance_Segmentation_MaskRCNN_ResNet50_v2",
        },
        TaskType.SEMANTIC_SEGMENTATION: {
            DefaultType.ACCURACY: "Custom_Semantic_Segmentation_DINOV2_S",
            DefaultType.SPEED: "Custom_Semantic_Segmentation_Lite-HRNet-s-mod2_OCR",
            DefaultType.BALANCE: "Custom_Semantic_Segmentation_Lite-HRNet-18-mod2_OCR",
        },
        TaskType.ANOMALY: {
            DefaultType.ACCURACY: "ote_anomaly_uflow",
            DefaultType.SPEED: "ote_anomaly_classification_padim",
            DefaultType.BALANCE: None,
        },
        TaskType.KEYPOINT_DETECTION: {
            DefaultType.ACCURACY: None,
            DefaultType.SPEED: "Keypoint_Detection_RTMPose_Tiny",
            DefaultType.BALANCE: None,
        },
    }

    @classmethod
    def get_model_by_type(cls, task_type: TaskType, default_type: DefaultType) -> str | None:
        """
        Retrieve a recommended model architecture for a specific task and optimization preference.

        :param task_type: The computer vision task category
        :param default_type: The optimization preference (accuracy, speed, or balance)
        :return: The name of the recommended model architecture, or None if no model is available
        :raises ValueError: If the task_type or default_type is not supported
        """
        if task_type not in cls.default_models_by_task:
            raise ValueError(f"Unknown task type: {task_type}")
        if default_type not in cls.default_models_by_task[task_type]:
            raise ValueError(f"Unknown default type: {default_type} for task: {task_type}")
        return cls.default_models_by_task[task_type][default_type]

    @classmethod
    def get_accuracy_model(cls, task_type: TaskType) -> str | None:
        """
        Gets the model architecture that prioritizes prediction quality over inference speed.

        :param task_type: The computer vision task category
        :return: The name of the accuracy-optimized model architecture, or None if not available
        :raises ValueError: If the task_type is not supported
        """
        return cls.get_model_by_type(task_type, DefaultType.ACCURACY)

    @classmethod
    def get_speed_model(cls, task_type: TaskType) -> str | None:
        """
        Gets the model architecture that prioritizes inference speed over prediction quality.

        :param task_type: The computer vision task category
        :return: The name of the speed-optimized model architecture, or None if not available
        :raises ValueError: If the task_type is not supported
        """
        return cls.get_model_by_type(task_type, DefaultType.SPEED)

    @classmethod
    def get_balanced_model(cls, task_type: TaskType) -> str | None:
        """
        Gets the model architecture that offers a compromise between accuracy and speed.

        :param task_type: The computer vision task category
        :return: The name of the balanced model architecture, or None if not available
        :raises ValueError: If the task_type is not supported
        """
        return cls.get_model_by_type(task_type, DefaultType.BALANCE)
