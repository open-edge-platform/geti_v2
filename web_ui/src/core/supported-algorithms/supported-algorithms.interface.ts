// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { DOMAIN } from '../projects/core.interface';
import {
    LifecycleStage,
    PerformanceCategory,
    SupportedAlgorithmStatsValues,
} from './dtos/supported-algorithms.interface';

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

export type TaskWithSupportedAlgorithms = Record<string, SupportedAlgorithm[]>;
