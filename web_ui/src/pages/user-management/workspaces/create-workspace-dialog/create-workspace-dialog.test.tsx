// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { act, fireEvent, screen } from '@testing-library/react';

import { providersRender } from '../../../../test-utils/required-providers-render';
import { CreateWorkspaceDialog } from './create-workspace-dialog.component';

const mockClose = jest.fn();
const mockOverlayTriggerState = {
    isOpen: true,
    setOpen: jest.fn(),
    open: jest.fn(),
    close: mockClose,
    toggle: jest.fn(),
};

describe('CreateWorkspaceDialog', () => {
    it('if the newName is empty, confirm button should be disabled', () => {
        providersRender(
            <CreateWorkspaceDialog
                triggerState={mockOverlayTriggerState}
                names={[]}
                nameLimitations={{ maxLength: 64, minLength: 1 }}
            />
        );

        const input = screen.getByRole('textbox', { name: 'Workspace name' });
        const confirmButton = screen.getByRole('button', { name: /confirm/i });

        fireEvent.change(input, { target: { value: '' } });

        expect(confirmButton).toBeDisabled();
    });

    it('should show error message when entered name already exists, confirm button should be disabled', () => {
        providersRender(
            <CreateWorkspaceDialog
                triggerState={mockOverlayTriggerState}
                names={['Workspace name']}
                nameLimitations={{ maxLength: 64, minLength: 1 }}
            />
        );

        const input = screen.getByRole('textbox', { name: 'Workspace name' });
        const confirmButton = screen.getByRole('button', { name: /confirm/i });

        fireEvent.change(input, { target: { value: 'Workspace name' } });

        expect(screen.getByText('Workspace name must be unique')).toBeInTheDocument();
        expect(confirmButton).toBeDisabled();
    });

    it('when the name is valid, confirm button should be enabled', () => {
        providersRender(
            <CreateWorkspaceDialog
                triggerState={mockOverlayTriggerState}
                names={['Workspace name']}
                nameLimitations={{ maxLength: 64, minLength: 1 }}
            />
        );

        const input = screen.getByRole('textbox', { name: 'Workspace name' });

        act(() => {
            fireEvent.change(input, { target: { value: 'New Workspace Name' } });
        });

        const confirmButton = screen.getByRole('button', { name: /confirm/i });

        expect(confirmButton).toBeEnabled();
    });
});
