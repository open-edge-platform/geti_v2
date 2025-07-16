// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { partition } from 'lodash-es';

import { SupportedAlgorithm } from '../../../../../../../core/supported-algorithms/supported-algorithms.interface';

export enum SortingOptions {
    RELEVANCE_ASC = 'relevance-asc',
    RELEVANCE_DESC = 'relevance-desc',
    NAME_ASC = 'name-asc',
    NAME_DESC = 'name-desc',
    INFERENCE_SPEED_ASC = 'inference-speed-asc',
    INFERENCE_SPEED_DESC = 'inference-speed-desc',
    TRAINING_TIME_ASC = 'training-time-asc',
    TRAINING_TIME_DESC = 'training-time-desc',
    ACCURACY_ASC = 'accuracy-asc',
    ACCURACY_DESC = 'accuracy-desc',
}

export const moveActiveArchitectureToBeRightAfterRecommended = (
    recommendedAlgorithms: SupportedAlgorithm[],
    otherAlgorithms: SupportedAlgorithm[],
    activeModelTemplateId: string | null
): [SupportedAlgorithm[], SupportedAlgorithm[]] => {
    if (activeModelTemplateId === null) {
        return [otherAlgorithms, recommendedAlgorithms];
    }

    if (recommendedAlgorithms.some((algorithm) => algorithm.modelTemplateId === activeModelTemplateId)) {
        return [otherAlgorithms, recommendedAlgorithms];
    }

    const [activeAlgorithm, rest] = partition(
        otherAlgorithms,
        (algorithm) => algorithm.modelTemplateId === activeModelTemplateId
    );

    return [activeAlgorithm.concat(...rest), recommendedAlgorithms];
};
