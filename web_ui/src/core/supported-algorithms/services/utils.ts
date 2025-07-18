// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { capitalize } from 'lodash-es';

import { DOMAIN } from '../../projects/core.interface';
import { getDomain } from '../../projects/project.interface';
import {
    LegacySupportedAlgorithmDTO,
    PerformanceCategory,
    SupportedAlgorithmDTO,
    SupportedAlgorithmsResponseDTO,
} from '../dtos/supported-algorithms.interface';
import { LegacySupportedAlgorithm, SupportedAlgorithm } from '../supported-algorithms.interface';

const getLegacySupportedAlgorithmEntity = (
    supportedAlgorithm: LegacySupportedAlgorithmDTO
): LegacySupportedAlgorithm => {
    const {
        task_type,
        model_template_id,
        model_size,
        name,
        gigaflops,
        summary,
        default_algorithm,
        performance_category,
        lifecycle_stage,
    } = supportedAlgorithm;
    const domain = getDomain(task_type) as DOMAIN;

    return {
        domain,
        description: summary,
        gigaflops,
        name,
        modelSize: model_size,
        templateName: performance_category !== PerformanceCategory.OTHER ? capitalize(performance_category) : undefined,
        isDefaultAlgorithm: default_algorithm,
        modelTemplateId: model_template_id,
        lifecycleStage: lifecycle_stage,
        performanceCategory: performance_category,
        license: 'Apache 2.0',
    };
};

export const getLegacySupportedAlgorithmsEntities = ({
    supported_algorithms,
}: SupportedAlgorithmsResponseDTO): LegacySupportedAlgorithm[] =>
    supported_algorithms.map(getLegacySupportedAlgorithmEntity);

export const getSupportedAlgorithmsEntities = (supportedAlgorithms: SupportedAlgorithmDTO[]): SupportedAlgorithm[] => {
    return supportedAlgorithms.map((supportedAlgorithm) => {
        const {
            capabilities,
            description,
            name,
            model_manifest_id,
            stats: {
                gigaflops,
                trainable_parameters,
                performance_ratings: { accuracy, inference_speed, training_time },
            },
            support_status,
            performance_category,
            supported_gpus: { intel, nvidia },
            is_default_model,
            task,
        } = supportedAlgorithm;
        const domain = getDomain(task) as DOMAIN;

        return {
            capabilities,
            description,
            name,
            domain,
            gigaflops,
            templateName:
                performance_category !== PerformanceCategory.OTHER ? capitalize(performance_category) : undefined,
            modelTemplateId: model_manifest_id,
            isDefaultAlgorithm: is_default_model,
            trainableParameters: trainable_parameters,
            performanceRatings: {
                accuracy,
                inferenceSpeed: inference_speed,
                trainingTime: training_time,
            },
            lifecycleStage: support_status,
            performanceCategory: performance_category,
            supportedGPUs: { intel, nvidia },
            license: 'Apache 2.0',
        };
    });
};
