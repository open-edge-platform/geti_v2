// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { toast } from '@geti/ui';
import {
    useMutation,
    UseMutationResult,
    useQueryClient,
    useSuspenseQuery,
    UseSuspenseQueryResult,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';

import QUERY_KEYS from '../../requests/query-keys';
import { useApplicationServices } from '../../services/application-services-provider.component';
import { getErrorMessage } from '../../services/utils';
import { RESOURCE_TYPE, USER_ROLE, User } from '../../users/users.interface';
import { getRoleCreationPayload } from '../../users/services/utils';
import { WorkspaceEntity } from '../services/workspaces.interface';
import { ProjectSortingOptions, ProjectsQueryOptions } from '../../../../../src/core/projects/services/project-service.interface';

interface UseWorkspacesApi {
    useWorkspacesQuery: () => UseSuspenseQueryResult<WorkspaceEntity[], AxiosError>;
    useCreateWorkspaceMutation: () => UseMutationResult<WorkspaceEntity, AxiosError, Pick<WorkspaceEntity, 'name'>>;
    useEditWorkspaceMutation: () => UseMutationResult<WorkspaceEntity, AxiosError, WorkspaceEntity>;
    useDeleteWorkspaceMutation: () => UseMutationResult<void, AxiosError, Pick<WorkspaceEntity, 'id'>>;
}

export const useWorkspacesApi = (organizationId: string): UseWorkspacesApi => {
    const { workspacesService, usersService, projectService } = useApplicationServices();

    const queryClient = useQueryClient();

    const useWorkspacesQuery: UseWorkspacesApi['useWorkspacesQuery'] = () => {
        return useSuspenseQuery<WorkspaceEntity[], AxiosError>({
            queryKey: QUERY_KEYS.WORKSPACES(organizationId),
            queryFn: () => workspacesService.getWorkspaces(organizationId),
            meta: { notifyOnError: true },
            staleTime: 1000 * 60,
        });
    };

    const useCreateWorkspaceMutation: UseWorkspacesApi['useCreateWorkspaceMutation'] = () => {
        return useMutation({
            mutationFn: async ({ name }) => {
                return workspacesService.createWorkspace(organizationId, name);
            },
            onSuccess: async (workspace) => {
                await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACES(organizationId) });

                try {
                    await queryClient.fetchQuery({
                        queryKey: QUERY_KEYS.WORKSPACES(organizationId),
                        queryFn: () => workspacesService.getWorkspaces(organizationId),
                        retry: 6,
                        retryDelay: (attempt) => Math.min(1000 * Math.pow(1.5, attempt), 4000),
                        meta: { notifyOnError: false },
                    });

                    const projectsQueryOptions: ProjectsQueryOptions = {
                        sortBy: ProjectSortingOptions.name,
                        sortDir: 'asc',
                    };

                    await queryClient.fetchQuery({
                        queryKey: QUERY_KEYS.PROJECTS_KEY(workspace.id, projectsQueryOptions),
                        queryFn: () =>
                            projectService.getProjects(
                                { organizationId, workspaceId: workspace.id },
                                projectsQueryOptions,
                                undefined,
                                false
                            ),
                        retry: 6,
                        retryDelay: (attempt) => Math.min(1000 * Math.pow(1.5, attempt), 4000),
                        // Don't show toasts, we'll handle error below if it persists
                        meta: { notifyOnError: false },
                    });

                    let activeUser = queryClient.getQueryData<User>(QUERY_KEYS.ACTIVE_USER(organizationId));
                    if (!activeUser) {
                        activeUser = await usersService.getActiveUser(organizationId);
                    }

                    if (activeUser) {
                        await usersService.updateRoles(organizationId, activeUser.id, [
                            getRoleCreationPayload({
                                role: USER_ROLE.WORKSPACE_ADMIN,
                                resourceId: workspace.id,
                                resourceType: RESOURCE_TYPE.WORKSPACE,
                            }),
                        ]);

                        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ACTIVE_USER(organizationId) });
                    }
                } catch (error) {
                    toast({ message: getErrorMessage(error as AxiosError), type: 'error' });
                }
            },
            onError: (error) => {
                toast({ message: getErrorMessage(error), type: 'error' });
            },
        });
    };

    const useEditWorkspaceMutation: UseWorkspacesApi['useEditWorkspaceMutation'] = () => {
        return useMutation({
            mutationFn: async (workspace) => {
                return workspacesService.editWorkspace({ organizationId, workspaceId: workspace.id }, workspace);
            },
            onSuccess: async () => {
                await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACES(organizationId) });
            },
            onError: (error) => {
                toast({ message: getErrorMessage(error), type: 'error' });
            },
        });
    };

    const useDeleteWorkspaceMutation: UseWorkspacesApi['useDeleteWorkspaceMutation'] = () => {
        return useMutation({
            mutationFn: async ({ id }) => {
                return workspacesService.deleteWorkspace({ organizationId, workspaceId: id });
            },
            onSuccess: async () => {
                await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACES(organizationId) });
            },
            onError: (error) => {
                toast({ message: getErrorMessage(error), type: 'error' });
            },
        });
    };

    return {
        useWorkspacesQuery,
        useCreateWorkspaceMutation,
        useEditWorkspaceMutation,
        useDeleteWorkspaceMutation,
    };
};
