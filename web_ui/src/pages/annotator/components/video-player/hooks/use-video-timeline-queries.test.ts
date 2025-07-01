// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ShapeType } from '../../../../../core/annotations/shapetype.enum';
import { getMockedAnnotation } from '../../../../../test-utils/mocked-items-factory/mocked-annotations';
import { getMockedKeypointNode } from '../../../../../test-utils/mocked-items-factory/mocked-keypoint';
import { getMockedLabel } from '../../../../../test-utils/mocked-items-factory/mocked-labels';
import { selectLabelsOfFrame } from './use-video-timeline-queries.hook';

describe('selectLabelsOfFrame', () => {
    it('return labels associated with annotations', () => {
        const labels = [
            { ...getMockedLabel({ id: 'label-1' }), source: { userId: '321' } },
            { ...getMockedLabel({ id: 'label-2' }), source: { userId: '231' } },
        ];

        const key = 20;
        const handler = selectLabelsOfFrame(key, false);
        const response = handler({ [key]: [getMockedAnnotation({ labels })] });

        labels.forEach(({ id }) => {
            expect(response.has(id)).toBe(true);
        });
    });

    it('return labels for keypoint nodes in pose annotation', () => {
        const key = 10;
        const keypointLabels = [getMockedLabel({ id: 'keypoint-1' }), getMockedLabel({ id: 'keypoint-2' })];
        const mockedKeypointAnnotation = getMockedAnnotation({
            shape: {
                shapeType: ShapeType.Pose,
                points: [
                    getMockedKeypointNode({ label: keypointLabels[0], x: 0, y: 0 }),
                    getMockedKeypointNode({ label: keypointLabels[1], x: 10, y: 10 }),
                ],
            },
        });

        const handler = selectLabelsOfFrame(key, true);
        const response = handler({ [key]: [mockedKeypointAnnotation] });

        keypointLabels.forEach(({ id }) => {
            expect(response.has(id)).toBe(true);
        });
    });
});
