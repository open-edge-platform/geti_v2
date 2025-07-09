// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { providersRender as render } from '../../../../../test-utils/required-providers-render';
import { errorMessage, LoadFileButton } from './load-file-button.component';

describe('LoadFileButton', () => {
    const validFile = new File(['file content'], 'test.png', { type: 'image/png' });
    const inValidFiles = new File(['foo'], 'video.mov', { type: 'video/quicktime' });

    it('calls onFileLoaded when valid file is selected', async () => {
        const mockOnFileLoaded = jest.fn();
        render(<LoadFileButton onFileLoaded={mockOnFileLoaded} />);

        const uploadFileElement = screen.getByTestId(/upload-sample-image/i);

        await userEvent.upload(uploadFileElement, [validFile]);

        expect(mockOnFileLoaded).toHaveBeenCalled();
    });

    it('displays error message when an invalid file is loaded', async () => {
        const mockOnFileLoaded = jest.fn();
        render(<LoadFileButton onFileLoaded={mockOnFileLoaded} />);

        const uploadFileElement = screen.getByTestId(/upload-sample-image/i);
        uploadFileElement.removeAttribute('accept');

        await userEvent.upload(uploadFileElement, [inValidFiles]);

        expect(mockOnFileLoaded).not.toHaveBeenCalled();
        expect(screen.getByText(errorMessage)).toBeVisible();
    });
});
