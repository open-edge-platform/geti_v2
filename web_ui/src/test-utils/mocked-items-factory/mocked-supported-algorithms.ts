// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { DOMAIN } from '../../core/projects/core.interface';
import {
    LifecycleStage,
    PerformanceCategory,
} from '../../core/supported-algorithms/dtos/supported-algorithms.interface';
import { SupportedAlgorithm } from '../../core/supported-algorithms/supported-algorithms.interface';

export const getMockedSupportedAlgorithm = (supportedAlgorithm?: Partial<SupportedAlgorithm>): SupportedAlgorithm => {
    return {
        templateName: undefined,
        name: 'Yolo algorithm',
        description: 'Description of the algorithm',
        domain: DOMAIN.DETECTION,
        modelTemplateId: 'yolo-template-id',
        isDefaultAlgorithm: false,
        lifecycleStage: LifecycleStage.ACTIVE,
        performanceCategory: PerformanceCategory.OTHER,
        license: 'Apache 2.0',
        gigaflops: 1.2,
        supportedGPUs: {
            intel: true,
            nvidia: true,
        },
        capabilities: {
            tiling: true,
            xai: true,
        },
        performanceRatings: {
            accuracy: '1',
            inferenceSpeed: '2',
            trainingTime: '3',
        },
        trainableParameters: 100,
        ...supportedAlgorithm,
    };
};
