// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { DOMAIN } from '../projects/core.interface';
import {
    LegacySupportedAlgorithmDTO,
    LifecycleStage,
    PerformanceCategory,
    SupportedAlgorithmStatsValues,
} from './dtos/supported-algorithms.interface';

export interface LegacySupportedAlgorithm {
    name: LegacySupportedAlgorithmDTO['name'];
    modelSize: LegacySupportedAlgorithmDTO['model_size'];
    modelTemplateId: LegacySupportedAlgorithmDTO['model_template_id'];
    templateName: string | undefined;
    domain: DOMAIN;
    description: string;
    gigaflops: number;
    isDefaultAlgorithm: boolean;
    lifecycleStage: LegacySupportedAlgorithmDTO['lifecycle_stage'];
    performanceCategory: LegacySupportedAlgorithmDTO['performance_category'];
    license: string;
}

export interface SupportedAlgorithm {
    name: string;
    modelTemplateId: string;
    domain: DOMAIN;
    description: string;
    isDefaultAlgorithm: boolean;
    lifecycleStage: LifecycleStage;
    performanceCategory: PerformanceCategory;
    capabilities: {
        tiling: boolean;
        xai: boolean;
    };
    supportedGPUs: {
        intel: boolean;
        nvidia: boolean;
    };
    gigaflops: number;
    trainableParameters: number; // in millions
    performanceRatings: {
        accuracy: SupportedAlgorithmStatsValues;
        inferenceSpeed: SupportedAlgorithmStatsValues;
        trainingTime: SupportedAlgorithmStatsValues;
    };
    license: string;
    templateName: string | undefined;
}

export type TaskWithSupportedAlgorithms = Record<string, LegacySupportedAlgorithm[] | SupportedAlgorithm[]>;
