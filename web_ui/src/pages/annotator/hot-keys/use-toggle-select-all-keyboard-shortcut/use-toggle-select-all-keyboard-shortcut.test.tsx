// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode } from 'react';

import { renderHook, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { RequiredProviders } from '../../../../test-utils/required-providers-render';
import { AnnotatorProviders } from '../../test-utils/annotator-render';
import { useToggleSelectAllKeyboardShortcut } from './use-toggle-select-all-keyboard-shortcut';

const wrapper = ({ children }: { children: ReactNode }) => {
    const datasetIdentifier = {
        workspaceId: 'workspace-id',
        projectId: 'project-id',
        datasetId: 'dataset-id',
        organizationId: 'organization-id',
    };

    return (
        <RequiredProviders>
            <AnnotatorProviders datasetIdentifier={datasetIdentifier}>{children}</AnnotatorProviders>
        </RequiredProviders>
    );
};

describe('useToggleSelectAllKeyboardShortcut', () => {
    it('should toggleSelectAll with "true" after "selectAll" hotkey is pressed', async () => {
        const toggleSelectAll = jest.fn();

        renderHook(() => useToggleSelectAllKeyboardShortcut(toggleSelectAll), {
            wrapper,
        });

        await waitForElementToBeRemoved(screen.getByRole('progressbar'));

        await userEvent.keyboard('{Control>}A');

        await waitFor(() => {
            expect(toggleSelectAll).toHaveBeenNthCalledWith(1, true);
        });
    });

    it('should toggleSelectAll with "false" after "deselectAll" hotkey is pressed', async () => {
        const toggleSelectAll = jest.fn();

        renderHook(() => useToggleSelectAllKeyboardShortcut(toggleSelectAll), {
            wrapper,
        });

        await waitForElementToBeRemoved(screen.getByRole('progressbar'));

        await userEvent.keyboard('{Control>}D');

        await waitFor(() => {
            expect(toggleSelectAll).toHaveBeenNthCalledWith(1, false);
        });
    });
});
