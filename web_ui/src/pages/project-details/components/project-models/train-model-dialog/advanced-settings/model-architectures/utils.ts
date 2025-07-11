// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { partition } from 'lodash-es';

import { SupportedAlgorithm } from '../../../../../../../core/supported-algorithms/supported-algorithms.interface';

export enum SortingOptions {
    RELEVANCE_DESC = 'relevance-desc',
    RELEVANCE_ASC = 'relevance-asc',
    NUMBER_OF_PARAMETERS_DESC = 'number-of-parameters-desc',
    NUMBER_OF_PARAMETERS_ASC = 'number-of-parameters-asc',
    COMPLEXITY_DESC = 'complexity-desc',
    COMPLEXITY_ASC = 'complexity-asc',
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
