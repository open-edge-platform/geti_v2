// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { act, waitFor } from '@testing-library/react';

import { getMockedProjectIdentifier } from '../../../test-utils/mocked-items-factory/mocked-identifiers';
import { renderHookWithProviders } from '../../../test-utils/render-hook-with-providers';
import { createInMemoryProjectService } from '../services/in-memory-project-service';
import { ProjectService } from '../services/project-service.interface';
import { useProjectActions } from './use-project-actions.hook';

const mockedToast = jest.fn();
jest.mock('@geti/ui', () => ({
    ...jest.requireActual('@geti/ui'),
    toast: (params: unknown) => mockedToast(params),
}));

const renderProjectActionsHook = ({ projectService }: { projectService: ProjectService }) => {
    return renderHookWithProviders(() => useProjectActions(), {
        providerProps: {
            projectService,
        },
    });
};

describe('useProjectActions', () => {
    describe('deleteProjectMutation', () => {
        it('call setQueryData when resolve successfully', async () => {
            const projectService = createInMemoryProjectService();
            projectService.deleteProject = jest.fn(async () => '');

            const { result } = renderProjectActionsHook({ projectService });

            const mockData = getMockedProjectIdentifier({ workspaceId: '1', projectId: '4' });

            act(() => {
                result.current.deleteProjectMutation.mutate(mockData);
            });

            await waitFor(() => {
                expect(projectService.deleteProject).toHaveBeenCalledWith(mockData);
            });

            expect(mockedToast).not.toHaveBeenCalled();
        });

        it('call "toast" when rejects', async () => {
            const error = { message: 'test' };
            const projectService = createInMemoryProjectService();
            projectService.deleteProject = jest.fn(() => Promise.reject(error));

            const { result } = renderProjectActionsHook({ projectService });

            const mockData = getMockedProjectIdentifier({ workspaceId: '1', projectId: '4' });

            act(() => {
                result.current.deleteProjectMutation.mutate(mockData);
            });

            await waitFor(() => {
                expect(projectService.deleteProject).toHaveBeenCalledWith(mockData);
            });

            expect(mockedToast).toHaveBeenCalledWith({ message: error.message, type: 'error' });
        });
    });
});
