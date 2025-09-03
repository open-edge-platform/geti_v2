// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { render, screen } from '@testing-library/react';

import { getMockedLabel } from '../../../../../../../../../test-utils/mocked-items-factory/mocked-labels';
import { Label } from './label.component';

describe('Label', () => {
    it('Check if label will render proper text with proper id', () => {
        const projectName = 'nametest';
        const label = getMockedLabel({
            name: 'dog',
            color: 'ededed',
            id: 'dog-id',
        });

        render(<Label projectName={projectName} label={label} />);
        const labelElement = screen.getByTestId(`project-labels-${projectName}-label-${label.name}`);

        expect(labelElement).toHaveTextContent(label.name);
    });
});
