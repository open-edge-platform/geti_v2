// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { waitFor } from '@testing-library/react';

import { getMockedProjectImportIdentifier } from '../../../test-utils/mocked-items-factory/mocked-identifiers';
import { renderHookWithProviders } from '../../../test-utils/render-hook-with-providers';
import { ExportStatusStateDTO } from '../../configurable-parameters/dtos/configurable-parameters.interface';
import { ProjectImportStatus } from '../project.interface';
import { createInMemoryProjectService } from '../services/in-memory-project-service';
import { ProjectService } from '../services/project-service.interface';
import { useImportProjectStatusQuery } from './use-import-project-status.hook';
import { IMPORT_STATUS_ERROR } from './use-import-project.hook';

const mockedToast = jest.fn();
jest.mock('@geti/ui', () => ({
    ...jest.requireActual('@geti/ui'),
    toast: (params: unknown) => mockedToast(params),
}));

const projectService = createInMemoryProjectService();
describe('useImportProjectStatusQuery', () => {
    const projectImportIdentifier = getMockedProjectImportIdentifier({ workspaceId: '123', importProjectId: '321' });
    const mockOnDone = jest.fn(() => Promise.resolve());
    const mockOnError = jest.fn();

    const renderImportProjectStatusQuery = (params: { projectService: ProjectService }) => {
        return renderHookWithProviders(
            () =>
                useImportProjectStatusQuery({
                    projectImportIdentifier,
                    onDone: mockOnDone,
                    onError: mockOnError,
                }),
            {
                providerProps: { projectService: params.projectService },
            }
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('importProjectStatusQuery', () => {
        it('shows notification error with resolve error status', async () => {
            projectService.getImportProjectStatus = jest.fn(
                async (): Promise<ProjectImportStatus> =>
                    Promise.resolve({
                        progress: -1,
                        projectId: null,
                        state: ExportStatusStateDTO.ERROR,
                    })
            );

            renderImportProjectStatusQuery({ projectService });

            await waitFor(() => {
                expect(projectService.getImportProjectStatus).toHaveBeenCalledWith(projectImportIdentifier);
                expect(mockOnError).toHaveBeenCalled();
            });

            expect(mockedToast).toHaveBeenCalledWith({
                message: IMPORT_STATUS_ERROR,
                type: 'error',
            });
        });

        it('does not show notification with resolve status different to error', async () => {
            projectService.getImportProjectStatus = jest.fn(
                async (): Promise<ProjectImportStatus> =>
                    Promise.resolve({
                        progress: -1,
                        projectId: null,
                        state: ExportStatusStateDTO.EXPORTING,
                    })
            );

            renderImportProjectStatusQuery({ projectService });

            await waitFor(() => {
                expect(projectService.getImportProjectStatus).toHaveBeenCalledWith(projectImportIdentifier);
            });

            expect(mockedToast).not.toHaveBeenCalled();
        });

        it('calls onDone', async () => {
            projectService.getImportProjectStatus = jest.fn(
                async (): Promise<ProjectImportStatus> =>
                    Promise.resolve({
                        progress: -1,
                        projectId: null,
                        state: ExportStatusStateDTO.DONE,
                    })
            );

            renderImportProjectStatusQuery({ projectService });

            await waitFor(() => {
                expect(projectService.getImportProjectStatus).toHaveBeenCalledWith(projectImportIdentifier);
                expect(mockOnDone).toHaveBeenCalled();
            });

            expect(mockedToast).not.toHaveBeenCalled();
        });
    });
});
