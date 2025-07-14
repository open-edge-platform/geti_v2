// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { fireEvent, render, screen } from '@testing-library/react';

import {
    LifecycleStage,
    PerformanceCategory,
} from '../../../../../../core/supported-algorithms/dtos/supported-algorithms.interface';
import { getMockedSupportedAlgorithm } from '../../../../../../test-utils/mocked-items-factory/mocked-supported-algorithms';
import { ModelType } from './model-type.component';

describe('ModelType', () => {
    it('displays tag that is passed as an argument', () => {
        const algorithm = getMockedSupportedAlgorithm({
            performanceCategory: PerformanceCategory.OTHER,
            name: 'Test Algorithm',
        });
        const tag = 'Hello from the other side';

        render(
            <ModelType
                name={algorithm.name}
                algorithm={algorithm}
                selectedModelTemplateId={'test'}
                onChangeSelectedTemplateId={jest.fn()}
                activeModelTemplateId={'test'}
                renderTag={() => <span>{tag}</span>}
            />
        );

        expect(screen.getByText(tag)).toBeInTheDocument();
    });

    it('displays active model tag when algorithm is active', () => {
        const algorithm = getMockedSupportedAlgorithm({
            modelTemplateId: 'test-template-id',
            name: 'Test Algorithm',
        });

        render(
            <ModelType
                name={algorithm.name}
                algorithm={algorithm}
                selectedModelTemplateId={'test'}
                onChangeSelectedTemplateId={jest.fn()}
                activeModelTemplateId={algorithm.modelTemplateId}
                renderTag={undefined}
            />
        );

        expect(screen.getByText('Active model')).toBeInTheDocument();
    });

    it('does not display active model tag when algorithm is not active', () => {
        const algorithm = getMockedSupportedAlgorithm({
            modelTemplateId: 'test-template-id',
            name: 'Test Algorithm',
        });

        render(
            <ModelType
                name={algorithm.name}
                algorithm={algorithm}
                selectedModelTemplateId={'test'}
                onChangeSelectedTemplateId={jest.fn()}
                activeModelTemplateId={'another-template-id'}
                renderTag={undefined}
            />
        );

        expect(screen.queryByText('Active model')).not.toBeInTheDocument();
    });

    it('displays deprecated tag when algorithm is deprecated', () => {
        const algorithm = getMockedSupportedAlgorithm({
            lifecycleStage: LifecycleStage.DEPRECATED,
        });

        render(
            <ModelType
                name={algorithm.name}
                algorithm={algorithm}
                selectedModelTemplateId={'test'}
                onChangeSelectedTemplateId={jest.fn()}
                activeModelTemplateId={'test'}
                renderTag={undefined}
            />
        );

        expect(screen.getByLabelText('Deprecated')).toBeInTheDocument();
    });

    it('does not display deprecated tag when algorithm is not deprecated', () => {
        const algorithm = getMockedSupportedAlgorithm({
            lifecycleStage: LifecycleStage.ACTIVE,
        });

        render(
            <ModelType
                name={algorithm.name}
                algorithm={algorithm}
                selectedModelTemplateId={'test'}
                onChangeSelectedTemplateId={jest.fn()}
                activeModelTemplateId={'test'}
                renderTag={undefined}
            />
        );

        expect(screen.queryByLabelText('Deprecated')).not.toBeInTheDocument();
    });

    it('displays performance ratings', () => {
        const algorithm = getMockedSupportedAlgorithm({
            performanceRatings: {
                inferenceSpeed: 1,
                trainingTime: 2,
                accuracy: 3,
            },
        });

        render(
            <ModelType
                name={algorithm.name}
                algorithm={algorithm}
                selectedModelTemplateId={'test'}
                onChangeSelectedTemplateId={jest.fn()}
                activeModelTemplateId={'test'}
                renderTag={undefined}
            />
        );

        expect(screen.getByLabelText('Attribute rating for Inference speed is LOW')).toBeInTheDocument();
        expect(screen.getByLabelText('Attribute rating for Training time is MEDIUM')).toBeInTheDocument();
        expect(screen.getByLabelText('Attribute rating for Accuracy is HIGH')).toBeInTheDocument();
    });

    it('passes model template id to onChangeSelectedTemplateId when model is clicked', () => {
        const algorithm = getMockedSupportedAlgorithm({
            lifecycleStage: LifecycleStage.ACTIVE,
            modelTemplateId: 'test-template-id',
            performanceCategory: PerformanceCategory.ACCURACY,
        });

        const mockedOnChangeSelectedTemplateId = jest.fn();

        render(
            <ModelType
                name={algorithm.name}
                algorithm={algorithm}
                selectedModelTemplateId={'test'}
                onChangeSelectedTemplateId={mockedOnChangeSelectedTemplateId}
                activeModelTemplateId={'test'}
                renderTag={undefined}
            />
        );

        fireEvent.click(screen.getByRole('radio', { name: algorithm.name }));
        expect(mockedOnChangeSelectedTemplateId).toHaveBeenCalledWith(algorithm.modelTemplateId);
    });

    it('selected model type is highlighted', () => {
        const algorithm = getMockedSupportedAlgorithm({
            modelTemplateId: 'test-template-id',
            lifecycleStage: LifecycleStage.ACTIVE,
            performanceCategory: PerformanceCategory.ACCURACY,
        });

        render(
            <ModelType
                name={algorithm.name}
                algorithm={algorithm}
                selectedModelTemplateId={algorithm.modelTemplateId}
                onChangeSelectedTemplateId={jest.fn()}
                activeModelTemplateId={'test'}
                renderTag={undefined}
            />
        );

        expect(screen.getByLabelText('Selected card')).toHaveClass('selectableCardSelected', { exact: false });
    });

    it('does not highlight model type when it is not selected', () => {
        const algorithm = getMockedSupportedAlgorithm({
            modelTemplateId: 'test-template-id',
            lifecycleStage: LifecycleStage.ACTIVE,
            performanceCategory: PerformanceCategory.ACCURACY,
        });

        render(
            <ModelType
                name={algorithm.name}
                algorithm={algorithm}
                selectedModelTemplateId={'another-template-id'}
                onChangeSelectedTemplateId={jest.fn()}
                activeModelTemplateId={'test'}
                renderTag={undefined}
            />
        );

        expect(screen.queryByLabelText('Selected card')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Not selected card')).not.toHaveClass('selectableCardSelected', { exact: false });
    });
});
