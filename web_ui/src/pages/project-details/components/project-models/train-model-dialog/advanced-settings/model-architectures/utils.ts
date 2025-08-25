// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { partition } from 'lodash-es';

import {
    LifecycleStage,
    PerformanceCategory,
} from '../../../../../../../core/supported-algorithms/dtos/supported-algorithms.interface';
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

export const orderRecommendedAlgorithms = (recommendedAlgorithms: SupportedAlgorithm[]) => {
    const accuracy = recommendedAlgorithms.find(
        (algorithm) => algorithm.performanceCategory === PerformanceCategory.ACCURACY
    );
    const speed = recommendedAlgorithms.find(
        (algorithm) => algorithm.performanceCategory === PerformanceCategory.SPEED
    );
    const balance = recommendedAlgorithms.find(
        (algorithm) => algorithm.performanceCategory === PerformanceCategory.BALANCE
    );

    return [balance, speed, accuracy].filter(Boolean) as SupportedAlgorithm[];
};

export const orderOtherAlgorithms = (algorithms: SupportedAlgorithm[]) => {
    const activeAlgorithms = algorithms.filter((algorithm) => algorithm.lifecycleStage === LifecycleStage.ACTIVE);
    const obsoleteAlgorithms = algorithms.filter((algorithm) => algorithm.lifecycleStage === LifecycleStage.OBSOLETE);
    const deprecatedAlgorithms = algorithms.filter(
        (algorithm) => algorithm.lifecycleStage === LifecycleStage.DEPRECATED
    );

    return [...activeAlgorithms, ...obsoleteAlgorithms, ...deprecatedAlgorithms];
};

export const moveActiveArchitectureToBeRightAfterRecommended = (
    recommendedAlgorithms: SupportedAlgorithm[],
    otherAlgorithms: SupportedAlgorithm[],
    activeModelTemplateId: string | null
): [SupportedAlgorithm[], SupportedAlgorithm[]] => {
    const orderedRecommendedAlgorithms = orderRecommendedAlgorithms(recommendedAlgorithms);
    const orderedOtherAlgorithms = orderOtherAlgorithms(otherAlgorithms);

    if (activeModelTemplateId === null) {
        return [orderedOtherAlgorithms, orderedRecommendedAlgorithms];
    }

    if (orderedRecommendedAlgorithms.some((algorithm) => algorithm.modelTemplateId === activeModelTemplateId)) {
        return [orderedOtherAlgorithms, orderedRecommendedAlgorithms];
    }

    const [activeAlgorithm, rest] = partition(
        orderedOtherAlgorithms,
        (algorithm) => algorithm.modelTemplateId === activeModelTemplateId
    );

    return [activeAlgorithm.concat(...rest), orderedRecommendedAlgorithms];
};
