// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { createInMemoryUsersService } from '@geti/core/src/users/services/in-memory-users-service';
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

const renderAvailableWorkspaceUsers = (options: {
    activeUserRoles: User['roles'];
    manageUsersRoles?: boolean;
    onUpdateRoles?: jest.Mock;
    onUpdateMemberRole?: jest.Mock;
    orgUsers?: User[];
    workspaceUsers?: User[];
}) => {
    const {
        activeUserRoles,
        manageUsersRoles = true,
        onUpdateRoles = jest.fn(),
        onUpdateMemberRole = jest.fn(),
        orgUsers = makeOrgUsers(),
        workspaceUsers: wsUsers = makeWorkspaceUsers(),
    } = options;

    const usersService = createInMemoryUsersService();

    usersService.getActiveUser = async () => makeActiveUser(activeUserRoles);
    usersService.getUser = async () => makeActiveUser(activeUserRoles);
    usersService.getUsers = async (_orgId: string, queryParams: UsersQueryParamsDTO) => {
        if (queryParams?.resourceType === ResourceTypeDTO.WORKSPACE && queryParams?.resourceId === workspaceId) {
            return usersResponse(wsUsers);
        }
        return usersResponse(orgUsers);
    };
    usersService.updateRoles = async (_orgId, _userId, _roles) => {
        onUpdateRoles({ _orgId, _userId, _roles });
    };
    usersService.updateMemberRole = async (_orgId, _memberId, _role) => {
        onUpdateMemberRole({ _orgId, _memberId, _role });
    };

    render(<AvailableWorkspaceUsers workspaceId={workspaceId} activeUser={makeActiveUser(activeUserRoles)} />, {
        services: { usersService },
        featureFlags: {
            FEATURE_FLAG_MANAGE_USERS: true,
            FEATURE_FLAG_WORKSPACE_ACTIONS: true,
            FEATURE_FLAG_MANAGE_USERS_ROLES: manageUsersRoles,
        },
    });

    return { usersService, onUpdateRoles, onUpdateMemberRole };
};

describe('AvailableWorkspaceUsers', () => {
    it('shows available users and new one when FEATURE_FLAG_MANAGE_USERS_ROLES is false', async () => {
        const onUpdateRoles = jest.fn();
        renderAvailableWorkspaceUsers({
            activeUserRoles: wsAdminOrgContributorRoles,
            onUpdateRoles,
            manageUsersRoles: false,
        });

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

    it('adds via roles API when FEATURE_FLAG_MANAGE_USERS_ROLES is true', async () => {
        const onUpdateMemberRole = jest.fn();
        renderAvailableWorkspaceUsers({
            activeUserRoles: wsAdminOrgContributorRoles,
            onUpdateMemberRole,
            manageUsersRoles: true,
        });

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
        renderAvailableWorkspaceUsers({ activeUserRoles: onlyOrgContributorRoles, manageUsersRoles: true });

        expect(
            await screen.findByRole('heading', { name: /available users to add to this workspace/i })
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /add u2@intel.com to workspace/i })).not.toBeInTheDocument();
    });

    it('renders nothing when there are no available users', async () => {
        renderAvailableWorkspaceUsers({
            activeUserRoles: wsAdminOrgContributorRoles,
            orgUsers: makeWorkspaceUsers(),
            workspaceUsers: makeWorkspaceUsers(),
        });

        expect(
            screen.queryByRole('heading', { name: /available users to add to this workspace/i })
        ).not.toBeInTheDocument();
    });
});
