// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { screen } from '@testing-library/react';

import { providersRender as render } from '../../../../../../../../test-utils/required-providers-render';
import { FineTuneParameters } from '../fine-tune-parameters.component';

describe('FineTuneParameters', () => {
    it('Pre-trained weights is selected when trainFromScratch is true', () => {
        render(
            <FineTuneParameters
                trainFromScratch
                onTrainFromScratchChange={jest.fn()}
                onReshufflingSubsetsEnabledChange={jest.fn()}
                isReshufflingSubsetsEnabled={false}
            />
        );

        expect(screen.getByRole('radio', { name: /pre\-trained weights/i })).toBeChecked();
        expect(screen.getByRole('radio', { name: /previous training weights/i })).not.toBeChecked();
    });

    it('Previous training weights is selected when trainFromScratch is false', () => {
        render(
            <FineTuneParameters
                trainFromScratch={false}
                onTrainFromScratchChange={jest.fn()}
                onReshufflingSubsetsEnabledChange={jest.fn()}
                isReshufflingSubsetsEnabled={false}
            />
        );

        expect(screen.getByRole('radio', { name: /previous training weights/i })).toBeChecked();
        expect(screen.getByRole('radio', { name: /pre\-trained weights/i })).not.toBeChecked();
    });

    it('Reshuffle subsets is disabled when Previous training weights is selected', () => {
        render(
            <FineTuneParameters
                trainFromScratch={false}
                onTrainFromScratchChange={jest.fn()}
                onReshufflingSubsetsEnabledChange={jest.fn()}
                isReshufflingSubsetsEnabled={false}
            />
        );

        expect(screen.getByRole('checkbox', { name: /reshuffle subsets/i })).toBeDisabled();
    });

    it('Reshuffle subsets is enabled when Pre-trained weights is selected', () => {
        render(
            <FineTuneParameters
                trainFromScratch
                onTrainFromScratchChange={jest.fn()}
                onReshufflingSubsetsEnabledChange={jest.fn()}
                isReshufflingSubsetsEnabled={false}
            />
        );

        expect(screen.getByRole('checkbox', { name: /reshuffle subsets/i })).toBeEnabled();
    });
});
