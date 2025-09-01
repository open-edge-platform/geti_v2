// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { createInMemoryUsersService } from '@geti/core/src/users/services/in-memory-users-service';
import { UsersService } from '@geti/core/src/users/services/users-service.interface';
import {
    RESOURCE_TYPE,
    ResourceTypeDTO,
    RoleOperationDTO,
    User,
    USER_ROLE,
    UserRoleDTO,
    UsersQueryParamsDTO,
    UsersResponse,
} from '@geti/core/src/users/users.interface';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getMockedUser } from '../../../../test-utils/mocked-items-factory/mocked-users';
import { providersRender as render } from '../../../../test-utils/required-providers-render';
import { AvailableWorkspaceUsers } from './available-workspace-users.component';

const workspaceId = 'workspace-1';
const organizationId = 'organization-id';

const makeOrgUsers = (): User[] => [
    getMockedUser({ id: 'u1', email: 'u1@intel.com' }),
    getMockedUser({ id: 'u2', email: 'u2@intel.com' }),
];

const makeWorkspaceUsers = (): User[] => [getMockedUser({ id: 'u1', email: 'u1@intel.com' })];

const usersResponse = (users: User[]): UsersResponse => ({
    users,
    totalCount: users.length,
    totalMatchedCount: users.length,
    nextPage: { skip: users.length, limit: 10 },
});

const makeActiveUser = (roles: User['roles']): User =>
    getMockedUser({
        roles,
        organizationId,
        email: 'active@intel.com',
        id: 'active-user-id',
    });

const wsAdminOrgContributorRoles: User['roles'] = [
    { role: USER_ROLE.ORGANIZATION_CONTRIBUTOR, resourceId: organizationId, resourceType: RESOURCE_TYPE.ORGANIZATION },
    { role: USER_ROLE.WORKSPACE_ADMIN, resourceId: workspaceId, resourceType: RESOURCE_TYPE.WORKSPACE },
];

const onlyOrgContributorRoles: User['roles'] = [
    { role: USER_ROLE.ORGANIZATION_CONTRIBUTOR, resourceId: organizationId, resourceType: RESOURCE_TYPE.ORGANIZATION },
];

const buildUsersService = (options: {
    activeUserRoles: User['roles'];
    onUpdateRoles?: jest.Mock;
    onUpdateMemberRole?: jest.Mock;
}): UsersService => {
    const { activeUserRoles, onUpdateRoles = jest.fn(), onUpdateMemberRole = jest.fn() } = options;

    const service = createInMemoryUsersService();

    service.getActiveUser = async () => makeActiveUser(activeUserRoles);
    service.getUser = async () => makeActiveUser(activeUserRoles);
    service.getUsers = async (_orgId: string, queryParams: UsersQueryParamsDTO) => {
        if (queryParams?.resourceType === ResourceTypeDTO.WORKSPACE && queryParams?.resourceId === workspaceId) {
            return usersResponse(makeWorkspaceUsers());
        }
        return usersResponse(makeOrgUsers());
    };
    service.updateRoles = async (_orgId, _userId, _roles) => {
        onUpdateRoles({ _orgId, _userId, _roles });
    };
    service.updateMemberRole = async (_orgId, _memberId, _role) => {
        onUpdateMemberRole({ _orgId, _memberId, _role });
    };

    return service;
};

describe('AvailableWorkspaceUsers', () => {
    it('shows available users and adds via legacy roles API when FEATURE_FLAG_MANAGE_USERS_ROLES is false', async () => {
        const onUpdateRoles = jest.fn();
        const usersService: UsersService = buildUsersService({
            activeUserRoles: wsAdminOrgContributorRoles,
            onUpdateRoles,
        });

        render(
            <AvailableWorkspaceUsers
                workspaceId={workspaceId}
                activeUser={makeActiveUser(wsAdminOrgContributorRoles)}
            />,
            {
                services: { usersService },
                featureFlags: { FEATURE_FLAG_MANAGE_USERS_ROLES: false },
            }
        );

        expect(
            await screen.findByRole('heading', { name: /available users to add to this workspace/i })
        ).toBeInTheDocument();

        // Only u2 is available (u1 is already a member)
        const addBtn = await screen.findByRole('button', { name: /add u2@intel.com to workspace/i });
        await userEvent.click(addBtn);

        expect(onUpdateRoles).toHaveBeenCalledTimes(1);
        expect(onUpdateRoles).toHaveBeenCalledWith(
            expect.objectContaining({
                _roles: [
                    {
                        operation: RoleOperationDTO.CREATE,
                        role: {
                            resourceId: workspaceId,
                            resourceType: ResourceTypeDTO.WORKSPACE,
                            role: UserRoleDTO.WORKSPACE_CONTRIBUTOR,
                        },
                    },
                ],
            })
        );
    });

    it('adds via new roles API when FEATURE_FLAG_MANAGE_USERS_ROLES is true', async () => {
        const onUpdateMemberRole = jest.fn();
        const usersService: UsersService = buildUsersService({
            activeUserRoles: wsAdminOrgContributorRoles,
            onUpdateMemberRole,
        });

        render(
            <AvailableWorkspaceUsers
                workspaceId={workspaceId}
                activeUser={makeActiveUser(wsAdminOrgContributorRoles)}
            />,
            {
                services: { usersService },
                featureFlags: { FEATURE_FLAG_MANAGE_USERS_ROLES: true },
            }
        );

        const addBtn = await screen.findByRole('button', { name: /add u2@intel.com to workspace/i });
        await userEvent.click(addBtn);

        expect(onUpdateMemberRole).toHaveBeenCalledTimes(1);
        expect(onUpdateMemberRole).toHaveBeenCalledWith(
            expect.objectContaining({
                _role: { role: USER_ROLE.WORKSPACE_CONTRIBUTOR, resourceId: workspaceId },
            })
        );
    });

    it('does not render the Add action when user lacks permission', async () => {
        const usersService: UsersService = buildUsersService({ activeUserRoles: onlyOrgContributorRoles });

        render(
            <AvailableWorkspaceUsers workspaceId={workspaceId} activeUser={makeActiveUser(onlyOrgContributorRoles)} />,
            {
                services: { usersService },
                featureFlags: { FEATURE_FLAG_MANAGE_USERS_ROLES: true },
            }
        );

        expect(
            await screen.findByRole('heading', { name: /available users to add to this workspace/i })
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /add u2@intel.com to workspace/i })).not.toBeInTheDocument();
    });

    it('renders nothing when there are no available users', async () => {
        const usersService: UsersService = createInMemoryUsersService();
        usersService.getActiveUser = async () => makeActiveUser(wsAdminOrgContributorRoles);
        usersService.getUser = async () => makeActiveUser(wsAdminOrgContributorRoles);
        usersService.getUsers = async (_orgId: string, _queryParams: UsersQueryParamsDTO) =>
            usersResponse(makeWorkspaceUsers());

        render(
            <AvailableWorkspaceUsers
                workspaceId={workspaceId}
                activeUser={makeActiveUser(wsAdminOrgContributorRoles)}
            />,
            {
                services: { usersService },
            }
        );

        expect(
            screen.queryByRole('heading', { name: /available users to add to this workspace/i })
        ).not.toBeInTheDocument();
    });
});
