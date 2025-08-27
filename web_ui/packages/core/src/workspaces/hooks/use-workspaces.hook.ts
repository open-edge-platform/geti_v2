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
import { User } from '../../users/users.interface';
import { WorkspaceEntity } from '../services/workspaces.interface';

interface UseWorkspacesApi {
    useWorkspacesQuery: () => UseSuspenseQueryResult<WorkspaceEntity[], AxiosError>;
    useCreateWorkspaceMutation: () => UseMutationResult<WorkspaceEntity, AxiosError, Pick<WorkspaceEntity, 'name'>>;
    useEditWorkspaceMutation: () => UseMutationResult<WorkspaceEntity, AxiosError, WorkspaceEntity>;
    useDeleteWorkspaceMutation: () => UseMutationResult<void, AxiosError, Pick<WorkspaceEntity, 'id'>>;
}

export const useWorkspacesApi = (organizationId: string): UseWorkspacesApi => {
    const { workspacesService, usersService } = useApplicationServices();

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
                let activeUser = queryClient.getQueryData<User>(QUERY_KEYS.ACTIVE_USER(organizationId));
                if (!activeUser) {
                    activeUser = await usersService.getActiveUser(organizationId);
                }
                const adminId = activeUser?.id;
                return workspacesService.createWorkspace(organizationId, name, adminId);
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
