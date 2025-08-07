// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { fireEvent, render, screen } from '@testing-library/react';

import { EXPORT_PROJECT_MODELS_OPTIONS } from '../../../../../../../../../core/projects/project.interface';
import { RequiredProviders } from '../../../../../../../../../test-utils/required-providers-render';
import { ExportProjectDialog } from './export-project-dialog.component';

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({
        organizationId: 'organization-id',
        workspaceId: 'workspace-id',
    }),
}));

describe('ExportProjectDialog', () => {
    const onClose = jest.fn();
    const onExportProject = jest.fn();

    const defaultProps = {
        isOpen: true,
        projectId: 'project-id',
        onClose,
        onExportProject,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders dialog with heading and radio options', () => {
        render(
            <RequiredProviders>
                <ExportProjectDialog {...defaultProps} />
            </RequiredProviders>
        );
        expect(screen.getByText(/Export project/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Select models for export/i)).toBeInTheDocument();
    });

    it('calls onClose when dialog is dismissed', () => {
        render(
            <RequiredProviders>
                <ExportProjectDialog {...defaultProps} />
            </RequiredProviders>
        );

        defaultProps.onClose();

        expect(onClose).toHaveBeenCalled();
    });

    it('calls onExportProject with correct arguments on submit when not changing radio buttons', () => {
        render(
            <RequiredProviders>
                <ExportProjectDialog {...defaultProps} />
            </RequiredProviders>
        );

        fireEvent.click(screen.getByRole('button', { name: /Export/ }));

        expect(onExportProject).toHaveBeenCalledWith(
            {
                organizationId: 'organization-id',
                workspaceId: 'workspace-id',
                projectId: 'project-id',
            },
            EXPORT_PROJECT_MODELS_OPTIONS.ALL
        );
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onExportProject with correct arguments on submit when radio button changed', () => {
        render(
            <RequiredProviders>
                <ExportProjectDialog {...defaultProps} />
            </RequiredProviders>
        );

        fireEvent.click(screen.getByText('None'));
        fireEvent.click(screen.getByRole('button', { name: /Export/ }));

        expect(onExportProject).toHaveBeenCalledWith(
            {
                organizationId: 'organization-id',
                workspaceId: 'workspace-id',
                projectId: 'project-id',
            },
            EXPORT_PROJECT_MODELS_OPTIONS.NONE
        );
        expect(onClose).toHaveBeenCalled();
    });
});
