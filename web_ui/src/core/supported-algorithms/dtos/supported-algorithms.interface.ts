// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { TASK_TYPE } from '../../projects/dtos/task.interface';

export enum PerformanceCategory {
    OTHER = 'other',
    SPEED = 'speed',
    BALANCE = 'balance',
    ACCURACY = 'accuracy',
}

export enum LifecycleStage {
    ACTIVE = 'active',
    OBSOLETE = 'obsolete',
    DEPRECATED = 'deprecated',
}

export type SupportedAlgorithmStatsValues = 1 | 2 | 3;

export interface SupportedAlgorithmDTO {
    capabilities: {
        tiling: boolean;
        xai: boolean;
    };
    description: string;
    name: string;
    model_manifest_id: string;
    stats: {
        gigaflops: number;
        trainable_parameters: number; // in millions
        performance_ratings: {
            accuracy: SupportedAlgorithmStatsValues;
            inference_speed: SupportedAlgorithmStatsValues;
            training_time: SupportedAlgorithmStatsValues;
        };
    };
    support_status: LifecycleStage;
    performance_category: PerformanceCategory;
    supported_gpus: {
        intel: boolean;
        nvidia: boolean;
    };
    is_default_model: boolean;
    task: TASK_TYPE;
}
