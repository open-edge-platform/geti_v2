// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { render, screen } from '@testing-library/react';

import { labelFromModel } from '../../../../core/annotations/utils';
import { LABEL_BEHAVIOUR } from '../../../../core/labels/label.interface';
import { getMockedAnnotation } from '../../../../test-utils/mocked-items-factory/mocked-annotations';
import { getMockedLabel } from '../../../../test-utils/mocked-items-factory/mocked-labels';
import { Layer } from './layer.component';

describe('Layer Component', () => {
    const mockedAnnotation = getMockedAnnotation({ id: '111' });
    const mockedBackgroundAnnotations = [
        getMockedAnnotation({
            id: '222',
            labels: [labelFromModel(getMockedLabel({ behaviour: LABEL_BEHAVIOUR.BACKGROUND }), 0.9, '', '')],
        }),
        getMockedAnnotation({
            id: '333',
            labels: [labelFromModel(getMockedLabel({ behaviour: LABEL_BEHAVIOUR.BACKGROUND }), 0.4, '', '')],
        }),
    ];

    it('does not display background mask when no background annotations', () => {
        render(
            <Layer
                width={0}
                height={0}
                selectedTask={null}
                isPredictionMode={false}
                globalAnnotations={[]}
                renderLabel={jest.fn()}
                annotations={[mockedAnnotation]}
            />
        );

        expect(screen.queryAllByLabelText('background-mask')).toHaveLength(0);
    });

    it('render background masks', () => {
        render(
            <Layer
                width={0}
                height={0}
                selectedTask={null}
                isPredictionMode={false}
                globalAnnotations={[]}
                renderLabel={jest.fn()}
                annotations={[mockedAnnotation, ...mockedBackgroundAnnotations]}
            />
        );

        // It generates a background mask for each background annotation, plus one for the mask annotation itself
        expect(screen.getAllByLabelText('background-mask')).toHaveLength(mockedBackgroundAnnotations.length + 1);
    });
});
