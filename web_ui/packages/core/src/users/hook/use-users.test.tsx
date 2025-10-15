// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { act, waitFor } from '@testing-library/react';

import { getMockedUser } from '../../../../../src/test-utils/mocked-items-factory/mocked-users';
import { renderHookWithProviders } from '../../../../../src/test-utils/render-hook-with-providers';
import { createInMemoryUsersService } from '../services/in-memory-users-service';
import { getRoleCreationPayload, getRoleDeletionPayload } from '../services/utils';
import { RESOURCE_TYPE, USER_ROLE } from '../users.interface';
import { useActiveUser, useUsers } from './use-users.hook';

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ workspaceId: 'workspace-id', projectId: 'project-id', organizationId: 'organization-123' }),
}));

const mockedUser = getMockedUser();
let mockedUsersService = createInMemoryUsersService();
mockedUsersService.getUser = jest.fn(async () => mockedUser);
mockedUsersService.updateRoles = jest.fn(mockedUsersService.updateRoles);
mockedUsersService.updateMemberRole = jest.fn(mockedUsersService.updateMemberRole);

const getProviderProps = (featureFlags?: Record<string, boolean>) => ({
    usersService: mockedUsersService,
    useInMemoryEnvironment: true as const,
    featureFlags,
});

describe('useUsers', () => {
    beforeEach(() => {
        mockedUsersService = createInMemoryUsersService();
        mockedUsersService.getUser = jest.fn(async () => mockedUser);
        const originalUpdateRoles = mockedUsersService.updateRoles;
        mockedUsersService.updateRoles = jest.fn(originalUpdateRoles);
        const originalUpdateMemberRole = mockedUsersService.updateMemberRole;
        mockedUsersService.updateMemberRole = jest.fn(originalUpdateMemberRole);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('gets activeUser', async () => {
        const { result } = renderHookWithProviders(() => useActiveUser('organization-id'), {
            providerProps: getProviderProps(),
        });

        await waitFor(() => {
            expect(result.current).not.toBeNull();
        });

        await waitFor(() => {
            expect(result.current.data).toStrictEqual(mockedUser);
        });
    });

    it('query is not executed if the user id is "undefined"', async () => {
        renderHookWithProviders(() => useUsers().useGetUserQuery('organization-id', undefined), {
            providerProps: getProviderProps(),
        });

        expect(mockedUsersService.getUser).not.toHaveBeenCalled();
    });

    it('query is not executed if the user id is invalid', async () => {
        renderHookWithProviders(() => useUsers().useGetUserQuery('organization-id', 'user@intel.com'), {
            providerProps: getProviderProps(),
        });

        expect(mockedUsersService.getUser).not.toHaveBeenCalled();
    });

    it('updates member role when feature flag is enabled', async () => {
        const { result } = renderHookWithProviders(() => useUsers().useUpdateRole(), {
            providerProps: getProviderProps({ FEATURE_FLAG_MANAGE_USERS_ROLES: true }),
        });

        await waitFor(() => {
            expect(result.current).not.toBeNull();
        });

        await act(async () => {
            await result.current.mutateAsync({
                organizationId: 'organization-id',
                userId: 'user-id',
                resourceId: 'organization-id',
                resourceType: RESOURCE_TYPE.ORGANIZATION,
                newRole: USER_ROLE.ORGANIZATION_CONTRIBUTOR,
            });
        });

        expect(mockedUsersService.updateMemberRole).toHaveBeenCalledTimes(1);
        expect(mockedUsersService.updateMemberRole).toHaveBeenCalledWith('organization-id', 'user-id', {
            role: USER_ROLE.ORGANIZATION_CONTRIBUTOR,
            resourceId: 'organization-id',
        });
        expect(mockedUsersService.updateRoles).not.toHaveBeenCalled();
    });

    it('updates roles when feature flag is disabled', async () => {
        const { result } = renderHookWithProviders(() => useUsers().useUpdateRole(), {
            providerProps: getProviderProps({ FEATURE_FLAG_MANAGE_USERS_ROLES: false }),
        });

        const payload = {
            organizationId: 'organization-id',
            userId: 'user-id',
            resourceId: 'organization-id',
            resourceType: RESOURCE_TYPE.ORGANIZATION,
            newRole: USER_ROLE.ORGANIZATION_CONTRIBUTOR,
            previousRole: USER_ROLE.ORGANIZATION_ADMIN,
        } as const;

        await waitFor(() => {
            expect(result.current).not.toBeNull();
        });

        await act(async () => {
            await result.current.mutateAsync(payload);
        });

        expect(mockedUsersService.updateRoles).toHaveBeenCalledTimes(1);
        expect(mockedUsersService.updateRoles).toHaveBeenCalledWith('organization-id', 'user-id', [
            getRoleDeletionPayload({
                role: payload.previousRole,
                resourceId: payload.resourceId,
                resourceType: payload.resourceType,
            }),
            getRoleCreationPayload({
                role: payload.newRole,
                resourceId: payload.resourceId,
                resourceType: payload.resourceType,
            }),
        ]);
        expect(mockedUsersService.updateMemberRole).not.toHaveBeenCalled();
    });
});
