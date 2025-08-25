// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import {
    LifecycleStage,
    PerformanceCategory,
} from '../../../../../../../core/supported-algorithms/dtos/supported-algorithms.interface';
import { getMockedSupportedAlgorithm } from '../../../../../../../test-utils/mocked-items-factory/mocked-supported-algorithms';
import {
    moveActiveArchitectureToBeRightAfterRecommended,
    orderOtherAlgorithms,
    orderRecommendedAlgorithms,
} from './utils';

describe('moveActiveArchitectureToBeRightAfterRecommended', () => {
    it('returns unsorted algorithms when active model is null', () => {
        const activeModelTemplateId = null;
        const recommendedAlgorithms = [
            getMockedSupportedAlgorithm({ modelTemplateId: '1', performanceCategory: PerformanceCategory.BALANCE }),
            getMockedSupportedAlgorithm({ modelTemplateId: '2', performanceCategory: PerformanceCategory.SPEED }),
            getMockedSupportedAlgorithm({ modelTemplateId: '3', performanceCategory: PerformanceCategory.ACCURACY }),
        ];
        const otherAlgorithms = [
            getMockedSupportedAlgorithm({ modelTemplateId: '4' }),
            getMockedSupportedAlgorithm({ modelTemplateId: '5' }),
            getMockedSupportedAlgorithm({ modelTemplateId: '6' }),
        ];
        expect(
            moveActiveArchitectureToBeRightAfterRecommended(
                recommendedAlgorithms,
                otherAlgorithms,
                activeModelTemplateId
            )
        ).toEqual([otherAlgorithms, recommendedAlgorithms]);
    });

    it('returns unsorted algorithms when active model is in recommended algorithms', () => {
        const activeModelTemplateId = '1';
        const recommendedAlgorithms = [
            getMockedSupportedAlgorithm({ modelTemplateId: '1', performanceCategory: PerformanceCategory.BALANCE }),
            getMockedSupportedAlgorithm({ modelTemplateId: '2', performanceCategory: PerformanceCategory.SPEED }),
            getMockedSupportedAlgorithm({ modelTemplateId: '3', performanceCategory: PerformanceCategory.ACCURACY }),
        ];
        const otherAlgorithms = [
            getMockedSupportedAlgorithm({ modelTemplateId: '4' }),
            getMockedSupportedAlgorithm({ modelTemplateId: '5' }),
            getMockedSupportedAlgorithm({ modelTemplateId: '6' }),
        ];
        expect(
            moveActiveArchitectureToBeRightAfterRecommended(
                recommendedAlgorithms,
                otherAlgorithms,
                activeModelTemplateId
            )
        ).toEqual([otherAlgorithms, recommendedAlgorithms]);
    });

    it('returns unsorted algorithms when active model is not part of the algorithms [it should never happen]', () => {
        const activeModelTemplateId = '11';
        const recommendedAlgorithms = [
            getMockedSupportedAlgorithm({ modelTemplateId: '1', performanceCategory: PerformanceCategory.BALANCE }),
            getMockedSupportedAlgorithm({ modelTemplateId: '2', performanceCategory: PerformanceCategory.SPEED }),
            getMockedSupportedAlgorithm({ modelTemplateId: '3', performanceCategory: PerformanceCategory.ACCURACY }),
        ];
        const otherAlgorithms = [
            getMockedSupportedAlgorithm({ modelTemplateId: '4' }),
            getMockedSupportedAlgorithm({ modelTemplateId: '5' }),
            getMockedSupportedAlgorithm({ modelTemplateId: '6' }),
        ];
        expect(
            moveActiveArchitectureToBeRightAfterRecommended(
                recommendedAlgorithms,
                otherAlgorithms,
                activeModelTemplateId
            )
        ).toEqual([otherAlgorithms, recommendedAlgorithms]);
    });

    it('moves active algorithm to be the first in the other algorithms list', () => {
        const activeModelTemplateId = '6';

        const recommendedAlgorithms = [
            getMockedSupportedAlgorithm({ modelTemplateId: '1', performanceCategory: PerformanceCategory.BALANCE }),
            getMockedSupportedAlgorithm({ modelTemplateId: '2', performanceCategory: PerformanceCategory.SPEED }),
            getMockedSupportedAlgorithm({ modelTemplateId: '3', performanceCategory: PerformanceCategory.ACCURACY }),
        ];
        const otherAlgorithms = [
            getMockedSupportedAlgorithm({ modelTemplateId: '4' }),
            getMockedSupportedAlgorithm({ modelTemplateId: '5' }),
            getMockedSupportedAlgorithm({ modelTemplateId: '6' }),
        ];

        const [newOtherAlgorithms, newRecommendedAlgorithms] = moveActiveArchitectureToBeRightAfterRecommended(
            recommendedAlgorithms,
            otherAlgorithms,
            activeModelTemplateId
        );

        expect(newOtherAlgorithms).toEqual([
            getMockedSupportedAlgorithm({ modelTemplateId: '6' }),
            getMockedSupportedAlgorithm({ modelTemplateId: '4' }),
            getMockedSupportedAlgorithm({ modelTemplateId: '5' }),
        ]);
        expect(newRecommendedAlgorithms).toEqual(recommendedAlgorithms);
    });
});

describe('orderRecommendedAlgorithms', () => {
    const algorithms = [
        getMockedSupportedAlgorithm({ modelTemplateId: '1', performanceCategory: PerformanceCategory.ACCURACY }),
        getMockedSupportedAlgorithm({ modelTemplateId: '2', performanceCategory: PerformanceCategory.BALANCE }),
        getMockedSupportedAlgorithm({ modelTemplateId: '3', performanceCategory: PerformanceCategory.SPEED }),
    ];

    it('returns algorithms in order: balance, speed, accuracy', () => {
        const result = orderRecommendedAlgorithms(algorithms);
        expect(result.map((algorithm) => algorithm.performanceCategory)).toEqual([
            PerformanceCategory.BALANCE,
            PerformanceCategory.SPEED,
            PerformanceCategory.ACCURACY,
        ]);
    });

    it('filters out missing categories', () => {
        const partial = algorithms.slice(0, 2); // only balance and accuracy
        const result = orderRecommendedAlgorithms(partial);
        expect(result.map((algorithm) => algorithm.performanceCategory)).toEqual([
            PerformanceCategory.BALANCE,
            PerformanceCategory.ACCURACY,
        ]);
    });
});

describe('orderOtherAlgorithms', () => {
    const algorithms = [
        getMockedSupportedAlgorithm({ modelTemplateId: '4', lifecycleStage: LifecycleStage.ACTIVE }),
        getMockedSupportedAlgorithm({ modelTemplateId: '5', lifecycleStage: LifecycleStage.OBSOLETE }),
        getMockedSupportedAlgorithm({ modelTemplateId: '6', lifecycleStage: LifecycleStage.ACTIVE }),
        getMockedSupportedAlgorithm({ modelTemplateId: '7', lifecycleStage: LifecycleStage.DEPRECATED }),
        getMockedSupportedAlgorithm({ modelTemplateId: '8', lifecycleStage: LifecycleStage.ACTIVE }),
    ];

    it('returns algorithms in order: active, obsolete, deprecated', () => {
        const result = orderOtherAlgorithms(algorithms);
        expect(result).toEqual([
            getMockedSupportedAlgorithm({ modelTemplateId: '4', lifecycleStage: LifecycleStage.ACTIVE }),
            getMockedSupportedAlgorithm({ modelTemplateId: '6', lifecycleStage: LifecycleStage.ACTIVE }),
            getMockedSupportedAlgorithm({ modelTemplateId: '8', lifecycleStage: LifecycleStage.ACTIVE }),
            getMockedSupportedAlgorithm({ modelTemplateId: '5', lifecycleStage: LifecycleStage.OBSOLETE }),
            getMockedSupportedAlgorithm({ modelTemplateId: '7', lifecycleStage: LifecycleStage.DEPRECATED }),
        ]);
    });
});
