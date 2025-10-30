// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { createInMemoryUsersService } from '@geti/core/src/users/services/in-memory-users-service';
import {
    RESOURCE_TYPE,
    ResourceTypeDTO,
    RoleOperationDTO,
    USER_ROLE,
    UserRoleDTO,
} from '@geti/core/src/users/users.interface';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { applicationRender as render } from '../../../../../test-utils/application-provider-render';
import { getMockedWorkspaceIdentifier } from '../../../../../test-utils/mocked-items-factory/mocked-identifiers';
import { getMockedAdminUser, getMockedUser } from '../../../../../test-utils/mocked-items-factory/mocked-users';
import { getMockedWorkspace } from '../../../../../test-utils/mocked-items-factory/mocked-workspace';
import { EditWorkspaceUserDialog } from './edit-workspace-user-dialog.component';

const mockedWorkspaceIdentifier = getMockedWorkspaceIdentifier({ workspaceId: 'testing-workspace' });
const mockedAdminUser = getMockedAdminUser(
    { firstName: 'John', lastName: 'Snow', id: 'user-id' },
    mockedWorkspaceIdentifier.workspaceId
);
const mockedWorkspace = getMockedWorkspace({ id: mockedWorkspaceIdentifier.workspaceId, name: 'Workspace 1' });

jest.mock('../../../../../providers/workspaces-provider/workspaces-provider.component', () => ({
    ...jest.requireActual('../../../../../providers/workspaces-provider/workspaces-provider.component'),
    useWorkspaces: jest.fn(() => ({
        workspaces: [mockedWorkspace],
        workspaceId: mockedWorkspaceIdentifier.workspaceId,
    })),
}));

describe('EditWorkspaceUserDialog', () => {
    it("allows organization admin to edit another user's workspace role", async () => {
        const orgAdminWorkspaceContributor = getMockedUser({
            roles: [
                {
                    role: USER_ROLE.ORGANIZATION_ADMIN,
                    resourceType: RESOURCE_TYPE.ORGANIZATION,
                    resourceId: mockedWorkspaceIdentifier.organizationId,
                },
            ],
            id: 'org-admin-contributor',
            firstName: 'Org',
            lastName: 'Admin',
        });
        const targetUser = getMockedUser({
            roles: [
                {
                    role: USER_ROLE.WORKSPACE_CONTRIBUTOR,
                    resourceType: RESOURCE_TYPE.WORKSPACE,
                    resourceId: mockedWorkspaceIdentifier.workspaceId,
                },
            ],
            id: 'target-user',
            firstName: 'Target',
            lastName: 'User',
        });

        await render(
            <EditWorkspaceUserDialog
                organizationId={mockedWorkspaceIdentifier.organizationId}
                workspaceId={mockedWorkspaceIdentifier.workspaceId}
                user={targetUser}
                closeDialog={jest.fn()}
                activeUser={orgAdminWorkspaceContributor}
                users={[orgAdminWorkspaceContributor, targetUser]}
            />,
            { featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: false, FEATURE_FLAG_MANAGE_USERS_ROLES: true } }
        );

        const roleButton = screen.getByTestId('roles-add-user');
        expect(roleButton).toBeInTheDocument();
        await userEvent.click(roleButton);
        expect(screen.getByRole('option', { name: /workspace contributor/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /workspace admin/i })).toBeInTheDocument();
    });
    describe('WORKSPACE_ACTION FF enabled', () => {
        it('save button is disabled when member data has not been changed', async () => {
            await render(
                <EditWorkspaceUserDialog
                    organizationId={mockedWorkspaceIdentifier.organizationId}
                    workspaceId={mockedWorkspaceIdentifier.workspaceId}
                    user={mockedAdminUser}
                    closeDialog={jest.fn()}
                    activeUser={mockedAdminUser}
                    users={[mockedAdminUser]}
                />,
                { featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: false } }
            );

            expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
        });

        it('Check edit dialog on SaaS environment', async () => {
            await render(
                <EditWorkspaceUserDialog
                    organizationId={mockedWorkspaceIdentifier.organizationId}
                    workspaceId={mockedWorkspaceIdentifier.workspaceId}
                    user={mockedAdminUser}
                    closeDialog={jest.fn()}
                    activeUser={mockedAdminUser}
                    users={[mockedAdminUser, getMockedAdminUser({ id: 'user-id-2' })]}
                />,
                { featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: true } }
            );

            expect(screen.getByText('Edit user')).toBeInTheDocument();
            expect(screen.getByTestId('user-email')).toHaveTextContent(mockedAdminUser.email);

            expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

            const workspaceRoleTrigger = screen.getByTestId('roles-add-user');
            expect(workspaceRoleTrigger).toHaveTextContent(/select a role/i);
            expect(workspaceRoleTrigger).toBeDisabled();
        });

        it('Check edit dialog on on-prem environment', async () => {
            await render(
                <EditWorkspaceUserDialog
                    organizationId={mockedWorkspaceIdentifier.organizationId}
                    workspaceId={mockedWorkspaceIdentifier.workspaceId}
                    user={mockedAdminUser}
                    closeDialog={jest.fn()}
                    activeUser={mockedAdminUser}
                    users={[
                        mockedAdminUser,
                        getMockedAdminUser({ id: 'user-id-2' }, mockedWorkspaceIdentifier.workspaceId),
                    ]}
                />,
                { featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: true } }
            );

            expect(screen.getByText('Edit user')).toBeInTheDocument();
            expect(screen.getByTestId('user-email')).toHaveTextContent(mockedAdminUser.email);

            expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

            const workspaceRoleTrigger = screen.getByTestId('roles-add-user');
            expect(workspaceRoleTrigger).toHaveTextContent(/workspace admin/i);
            expect(workspaceRoleTrigger).toBeEnabled();
        });

        describe('roles edition', () => {
            it('updates workspace roles via updateRoles when WORKSPACE_ACTIONS is enabled', async () => {
                const usersService = createInMemoryUsersService();
                usersService.updateRoles = jest.fn();

                await render(
                    <EditWorkspaceUserDialog
                        organizationId={mockedWorkspaceIdentifier.organizationId}
                        workspaceId={mockedWorkspaceIdentifier.workspaceId}
                        user={mockedAdminUser}
                        closeDialog={jest.fn()}
                        activeUser={mockedAdminUser}
                        users={[
                            mockedAdminUser,
                            getMockedAdminUser({ id: 'user-id-2' }, mockedWorkspaceIdentifier.workspaceId),
                        ]}
                    />,
                    {
                        featureFlags: {
                            FEATURE_FLAG_WORKSPACE_ACTIONS: true,
                            FEATURE_FLAG_MANAGE_USERS_ROLES: true,
                        },
                        services: { usersService },
                    }
                );

                await userEvent.click(screen.getByTestId('roles-add-user'));
                await userEvent.click(screen.getByRole('option', { name: /workspace contributor/i }));

                await userEvent.click(screen.getByRole('button', { name: 'Save' }));

                await waitFor(() => {
                    expect(usersService.updateRoles).toHaveBeenCalledTimes(1);
                });

                expect(usersService.updateRoles).toHaveBeenCalledWith(
                    mockedWorkspaceIdentifier.organizationId,
                    mockedAdminUser.id,
                    expect.arrayContaining([
                        expect.objectContaining({
                            operation: RoleOperationDTO.DELETE,
                            role: expect.objectContaining({
                                resourceId: mockedWorkspaceIdentifier.workspaceId,
                                resourceType: ResourceTypeDTO.WORKSPACE,
                                role: UserRoleDTO.WORKSPACE_ADMIN,
                            }),
                        }),
                        expect.objectContaining({
                            operation: RoleOperationDTO.CREATE,
                            role: expect.objectContaining({
                                resourceId: mockedWorkspaceIdentifier.workspaceId,
                                resourceType: ResourceTypeDTO.WORKSPACE,
                                role: UserRoleDTO.WORKSPACE_CONTRIBUTOR,
                            }),
                        }),
                    ])
                );
            });
        });
    });

    describe('WORKSPACE_ACTION FF disabled', () => {
        it('save button is disabled when member data has not been changed', async () => {
            await render(
                <EditWorkspaceUserDialog
                    organizationId={mockedWorkspaceIdentifier.organizationId}
                    workspaceId={mockedWorkspaceIdentifier.workspaceId}
                    user={mockedAdminUser}
                    closeDialog={jest.fn()}
                    activeUser={mockedAdminUser}
                    users={[mockedAdminUser]}
                />,
                { featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: false } }
            );

            expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
        });

        it('Check edit dialog on SaaS environment', async () => {
            await render(
                <EditWorkspaceUserDialog
                    organizationId={mockedWorkspaceIdentifier.organizationId}
                    workspaceId={mockedWorkspaceIdentifier.workspaceId}
                    user={mockedAdminUser}
                    closeDialog={jest.fn()}
                    activeUser={mockedAdminUser}
                    users={[
                        mockedAdminUser,
                        getMockedAdminUser({ id: 'user-id-2' }, mockedWorkspaceIdentifier.workspaceId),
                    ]}
                />,
                { featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: false } }
            );

            expect(screen.getByText('Edit user')).toBeInTheDocument();
            expect(screen.getByTestId('user-email')).toHaveTextContent(mockedAdminUser.email);

            expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

            expect(screen.getByTestId('roles-add-user')).toBeEnabled();

            await userEvent.click(screen.getByTestId('roles-add-user'));

            await userEvent.click(screen.getByRole('option', { name: /workspace contributor/i }));
        });

        describe('roles edition', () => {
            it("edits member's role", async () => {
                const usersService = createInMemoryUsersService();
                usersService.updateRoles = jest.fn();

                await render(
                    <EditWorkspaceUserDialog
                        organizationId={mockedWorkspaceIdentifier.organizationId}
                        workspaceId={mockedWorkspaceIdentifier.workspaceId}
                        user={mockedAdminUser}
                        closeDialog={jest.fn()}
                        activeUser={mockedAdminUser}
                        users={[
                            mockedAdminUser,
                            getMockedAdminUser({ id: 'user-id-2' }, mockedWorkspaceIdentifier.workspaceId),
                        ]}
                    />,
                    {
                        featureFlags: {
                            FEATURE_FLAG_WORKSPACE_ACTIONS: false,
                            FEATURE_FLAG_MANAGE_USERS_ROLES: true,
                        },
                        services: {
                            usersService,
                        },
                    }
                );

                await userEvent.click(screen.getByTestId('roles-add-user'));
                await userEvent.click(screen.getByRole('option', { name: /workspace contributor/i }));

                await userEvent.click(screen.getByRole('button', { name: 'Save' }));

                await waitFor(() => {
                    expect(usersService.updateRoles).toHaveBeenCalledWith(
                        mockedWorkspaceIdentifier.organizationId,
                        mockedAdminUser.id,
                        expect.arrayContaining([
                            expect.objectContaining({
                                operation: RoleOperationDTO.DELETE,
                                role: expect.objectContaining({
                                    resourceId: mockedWorkspaceIdentifier.workspaceId,
                                    resourceType: ResourceTypeDTO.WORKSPACE,
                                    role: UserRoleDTO.WORKSPACE_ADMIN,
                                }),
                            }),
                            expect.objectContaining({
                                operation: RoleOperationDTO.CREATE,
                                role: expect.objectContaining({
                                    resourceId: mockedWorkspaceIdentifier.workspaceId,
                                    resourceType: ResourceTypeDTO.WORKSPACE,
                                    role: UserRoleDTO.WORKSPACE_CONTRIBUTOR,
                                }),
                            }),
                        ])
                    );
                });
            });
        });

        it('active member cannot edit member role when their role is a workspace contributor', async () => {
            const memberContributor = getMockedUser({
                roles: [
                    {
                        role: USER_ROLE.WORKSPACE_CONTRIBUTOR,
                        resourceType: RESOURCE_TYPE.WORKSPACE,
                        resourceId: mockedWorkspaceIdentifier.workspaceId,
                    },
                ],
            });
            await render(
                <EditWorkspaceUserDialog
                    organizationId={mockedWorkspaceIdentifier.organizationId}
                    workspaceId={mockedWorkspaceIdentifier.workspaceId}
                    user={mockedAdminUser}
                    closeDialog={jest.fn()}
                    activeUser={memberContributor}
                    users={[memberContributor, mockedAdminUser]}
                />,
                {
                    featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: false, FEATURE_FLAG_MANAGE_USERS_ROLES: true },
                }
            );

            expect(screen.getByTestId('roles-add-user')).toBeDisabled();
        });

        it('active member cannot edit member their role when active member is the only workspace admin', async () => {
            const memberContributor = getMockedUser({
                roles: [
                    {
                        role: USER_ROLE.WORKSPACE_CONTRIBUTOR,
                        resourceType: RESOURCE_TYPE.WORKSPACE,
                        resourceId: mockedWorkspaceIdentifier.workspaceId,
                    },
                ],
            });

            await render(
                <EditWorkspaceUserDialog
                    organizationId={mockedWorkspaceIdentifier.organizationId}
                    workspaceId={mockedWorkspaceIdentifier.workspaceId}
                    user={mockedAdminUser}
                    closeDialog={jest.fn()}
                    activeUser={mockedAdminUser}
                    users={[memberContributor, mockedAdminUser]}
                />,
                {
                    featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: false, FEATURE_FLAG_MANAGE_USERS_ROLES: true },
                }
            );

            expect(screen.getByTestId('roles-add-user')).toBeDisabled();
        });

        it('active member can edit member other member role when active member is a workspace admin', async () => {
            const memberContributor = getMockedUser({
                roles: [
                    {
                        role: USER_ROLE.WORKSPACE_CONTRIBUTOR,
                        resourceType: RESOURCE_TYPE.WORKSPACE,
                        resourceId: mockedWorkspaceIdentifier.workspaceId,
                    },
                ],
            });

            await render(
                <EditWorkspaceUserDialog
                    organizationId={mockedWorkspaceIdentifier.organizationId}
                    workspaceId={mockedWorkspaceIdentifier.workspaceId}
                    user={memberContributor}
                    closeDialog={jest.fn()}
                    activeUser={mockedAdminUser}
                    users={[memberContributor, mockedAdminUser]}
                />,
                {
                    featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: false, FEATURE_FLAG_MANAGE_USERS_ROLES: true },
                }
            );

            await userEvent.click(screen.getByTestId('roles-add-user'));

            expect(await screen.findByRole('option', { name: /workspace contributor/i })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: /workspace admin/i })).toBeInTheDocument();
        });

        it('active member can edit member their role when there are more admins than one', async () => {
            await render(
                <EditWorkspaceUserDialog
                    organizationId={mockedWorkspaceIdentifier.organizationId}
                    workspaceId={mockedWorkspaceIdentifier.workspaceId}
                    user={mockedAdminUser}
                    closeDialog={jest.fn()}
                    activeUser={mockedAdminUser}
                    users={[
                        mockedAdminUser,
                        getMockedAdminUser({ id: 'user-id-2' }, mockedWorkspaceIdentifier.workspaceId),
                    ]}
                />,
                {
                    featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: false, FEATURE_FLAG_MANAGE_USERS_ROLES: true },
                }
            );

            await userEvent.click(screen.getByTestId('roles-add-user'));

            expect(await screen.findByRole('option', { name: /workspace contributor/i })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: /workspace admin/i })).toBeInTheDocument();
        });
    });
});
