// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { KeypointNode } from '../../core/annotations/shapes.interface';
import { KeypointStructureDTO } from '../../core/projects/dtos/task.interface';
import { getMockedLabel } from './mocked-labels';

export const getMockedKeypointNode = (point?: Partial<KeypointNode>): KeypointNode => {
    return {
        x: 0,
        y: 0,
        isVisible: true,
        label: getMockedLabel({ color: '#000000' }),
        ...point,
    };
};

export const getMockedKeypointStructureDto = (props?: Partial<KeypointStructureDTO>): KeypointStructureDTO => {
    return {
        edges: [{ nodes: ['label_1', 'label_2'] }],
        positions: [
            { label: 'label_1', x: 0.248, y: 0.25 },
            { label: 'label_2', x: 0.33066666666666666, y: 0.506 },
        ],
        ...props,
    };
};
