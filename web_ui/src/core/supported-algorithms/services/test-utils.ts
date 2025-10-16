// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { DOMAIN } from '../../projects/core.interface';
import { TASK_TYPE } from '../../projects/dtos/task.interface';
import { LifecycleStage, PerformanceCategory, SupportedAlgorithmDTO } from '../dtos/supported-algorithms.interface';
import { SupportedAlgorithm } from '../supported-algorithms.interface';
import { getSupportedAlgorithmsEntities } from './utils';

export const mockedSupportedAlgorithmsDTO: SupportedAlgorithmDTO[] = [
    {
        name: 'Yolo',
        task: TASK_TYPE.DETECTION,
        model_manifest_id: 'detection_yolo',
        stats: {
            gigaflops: 5,
            trainable_parameters: 0,
            performance_ratings: {
                accuracy: 3,
                inference_speed: 3,
                training_time: 3,
            },
        },
        description: 'YOLO architecture for detection',
        is_default_model: false,
        support_status: LifecycleStage.ACTIVE,
        performance_category: PerformanceCategory.ACCURACY,
        capabilities: {
            tiling: false,
            xai: false,
        },
        supported_gpus: {
            intel: false,
            nvidia: false,
        },
    },
    {
        name: 'SSD',
        task: TASK_TYPE.DETECTION,
        model_manifest_id: 'detection_ssd',
        stats: {
            gigaflops: 3,
            trainable_parameters: 0,
            performance_ratings: {
                accuracy: 3,
                inference_speed: 3,
                training_time: 3,
            },
        },
        description: 'SSD architecture for detection',
        is_default_model: false,
        support_status: LifecycleStage.ACTIVE,
        performance_category: PerformanceCategory.OTHER,
        capabilities: {
            tiling: false,
            xai: false,
        },
        supported_gpus: {
            intel: false,
            nvidia: false,
        },
    },
    {
        name: 'HDD',
        task: TASK_TYPE.DETECTION,
        model_manifest_id: 'detection_hdd',
        stats: {
            gigaflops: 1,
            trainable_parameters: 0,
            performance_ratings: {
                accuracy: 3,
                inference_speed: 3,
                training_time: 3,
            },
        },
        description: 'HDD architecture for detection',
        is_default_model: false,
        support_status: LifecycleStage.ACTIVE,
        performance_category: PerformanceCategory.OTHER,
        capabilities: {
            tiling: false,
            xai: false,
        },
        supported_gpus: {
            intel: false,
            nvidia: false,
        },
    },
    {
        name: 'Efficient-B0',
        task: TASK_TYPE.CLASSIFICATION,
        model_manifest_id: 'classification_efficient_b0',
        stats: {
            gigaflops: 0.8,
            trainable_parameters: 0,
            performance_ratings: {
                accuracy: 3,
                inference_speed: 3,
                training_time: 3,
            },
        },
        description: 'Efficient-B0 architecture for classification',
        is_default_model: false,
        support_status: LifecycleStage.ACTIVE,
        performance_category: PerformanceCategory.OTHER,
        capabilities: {
            tiling: false,
            xai: false,
        },
        supported_gpus: {
            intel: false,
            nvidia: false,
        },
    },
    {
        name: 'Mobile-Net',
        task: TASK_TYPE.CLASSIFICATION,
        model_manifest_id: 'classification_mobile_net',
        stats: {
            gigaflops: 1.1,
            trainable_parameters: 0,
            performance_ratings: {
                accuracy: 3,
                inference_speed: 3,
                training_time: 3,
            },
        },
        description: 'Mobile-Net architecture for classification',
        is_default_model: false,
        support_status: LifecycleStage.ACTIVE,
        performance_category: PerformanceCategory.OTHER,
        capabilities: {
            tiling: false,
            xai: false,
        },
        supported_gpus: {
            intel: false,
            nvidia: false,
        },
    },
    {
        name: 'Segmentation-HDD',
        task: TASK_TYPE.SEGMENTATION,
        model_manifest_id: 'segmentation_hdd',
        stats: {
            gigaflops: 1,
            trainable_parameters: 0,
            performance_ratings: {
                accuracy: 3,
                inference_speed: 3,
                training_time: 3,
            },
        },
        description: 'Segmentation-HDD architecture for segmentation',
        is_default_model: false,
        support_status: LifecycleStage.ACTIVE,
        performance_category: PerformanceCategory.OTHER,
        capabilities: {
            tiling: false,
            xai: false,
        },
        supported_gpus: {
            intel: false,
            nvidia: false,
        },
    },
    {
        name: 'Anomaly-SSD',
        task: TASK_TYPE.ANOMALY_CLASSIFICATION,
        model_manifest_id: 'anomaly_ssd',
        stats: {
            gigaflops: 1,
            trainable_parameters: 0,
            performance_ratings: {
                accuracy: 3,
                inference_speed: 3,
                training_time: 3,
            },
        },
        description: 'Anomaly-SSD architecture for anomaly',
        support_status: LifecycleStage.ACTIVE,
        performance_category: PerformanceCategory.OTHER,
        capabilities: {
            tiling: false,
            xai: false,
        },
        supported_gpus: {
            intel: false,
            nvidia: false,
        },
        is_default_model: false,
    },
    {
        name: 'Segmentation-SSD',
        task: TASK_TYPE.SEGMENTATION,
        model_manifest_id: 'segmentation_ssd',
        stats: {
            gigaflops: 23,
            trainable_parameters: 0,
            performance_ratings: {
                accuracy: 3,
                inference_speed: 3,
                training_time: 3,
            },
        },
        description: 'Segmentation-SSD for segmentation',
        is_default_model: false,
        support_status: LifecycleStage.ACTIVE,
        performance_category: PerformanceCategory.OTHER,
        capabilities: {
            tiling: false,
            xai: false,
        },
        supported_gpus: {
            intel: false,
            nvidia: false,
        },
    },
];

export const mockedSupportedAlgorithms: SupportedAlgorithm[] =
    getSupportedAlgorithmsEntities(mockedSupportedAlgorithmsDTO);

export const mockedDetectionSupportedAlgorithms = mockedSupportedAlgorithms.filter(
    ({ domain }) => domain === DOMAIN.DETECTION
);
