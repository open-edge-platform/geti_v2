// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { fireEvent, screen } from '@testing-library/react';

import { annotatorRender } from '../../../../annotator/test-utils/annotator-render';
import { PreviewGalleryDialog, PreviewGalleryDialogProps } from './preview-gallery-dialog.component';

const mockMedia = [new File([], 'Image 1'), new File([], 'Image 2'), new File([], 'Video 1')];

describe('PreviewGalleryDialog', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderApp = async ({
        isOpen = true,
        files = mockMedia,
        onClose = jest.fn(),
        onUpload = jest.fn(),
    }: Partial<PreviewGalleryDialogProps>) => {
        return annotatorRender(
            <PreviewGalleryDialog isOpen={isOpen} onClose={onClose} files={files} onUpload={onUpload} labelIds={[]} />
        );
    };

    it('calls onClose when cancel button is clicked', async () => {
        const mockOnClose = jest.fn();
        await renderApp({ onClose: mockOnClose });

        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onUpload when upload button is clicked', async () => {
        const mockOnUpload = jest.fn();
        await renderApp({ onUpload: mockOnUpload });

        fireEvent.click(screen.getByRole('button', { name: /Upload/i }));

        expect(mockOnUpload).toHaveBeenCalledTimes(1);
    });

    it('does not render when isOpen is false', async () => {
        await renderApp({ isOpen: false });

        expect(screen.queryByRole('heading', { name: /Preview gallery/i })).not.toBeInTheDocument();
    });

    it('disables upload button when no files are provided', async () => {
        await renderApp({ files: [] });

        expect(screen.getByRole('button', { name: /Upload/i })).toBeDisabled();
    });
});
