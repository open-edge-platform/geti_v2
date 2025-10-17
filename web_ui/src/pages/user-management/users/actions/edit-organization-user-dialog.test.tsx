// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { createInMemoryUsersService } from '@geti/core/src/users/services/in-memory-users-service';
import {
    ResourceTypeDTO,
    RoleOperationDTO,
    USER_ROLE,
    UserRoleDTO,
    type User,
} from '@geti/core/src/users/users.interface';
import { screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { applicationRender as render } from '../../../../test-utils/application-provider-render';
import {
    getMockedOrganizationAdminUser,
    getMockedOrganizationContributorUser,
} from '../../../../test-utils/mocked-items-factory/mocked-users';
import { EditOrganizationUserDialog } from './edit-organization-user-dialog.component';

describe('EditOrganizationUserDialog', () => {
    const organizationId = 'organization-id';

    const createOrgAdmin = (overrides: Partial<User> = {}, workspaceId = 'workspace-id') =>
        getMockedOrganizationAdminUser(overrides, workspaceId, organizationId);

    const createOrgContributor = (overrides: Partial<User> = {}) =>
        getMockedOrganizationContributorUser({ organizationId, ...overrides });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('disables name fields and save button when nothing changed in SaaS environment', async () => {
        const admin = createOrgAdmin({
            id: 'org-admin',
            firstName: 'Alice',
            lastName: 'Admin',
            email: 'alice.admin@geti.com',
        });
        const secondAdmin = createOrgAdmin({ id: 'org-admin-2' }, 'workspace-id-2');

        await render(
            <EditOrganizationUserDialog
                organizationId={organizationId}
                user={admin}
                users={[admin, secondAdmin]}
                activeUser={admin}
                isSaasEnvironment
                closeDialog={jest.fn()}
            />
        );

        expect(screen.getByLabelText('First name')).toBeDisabled();
        expect(screen.getByLabelText('Last name')).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('allows editing names when not in SaaS environment', async () => {
        const contributor = createOrgContributor({
            id: 'org-contributor',
            firstName: 'Cora',
            lastName: 'Contributor',
            email: 'cora.contributor@geti.com',
        });
        const admin = createOrgAdmin({ id: 'active-admin' });

        await render(
            <EditOrganizationUserDialog
                organizationId={organizationId}
                user={contributor}
                users={[contributor, admin]}
                activeUser={contributor}
                isSaasEnvironment={false}
                closeDialog={jest.fn()}
            />
        );

        expect(screen.getByLabelText('First name')).toBeEnabled();
        expect(screen.getByLabelText('Last name')).toBeEnabled();
    });

    it('calls updateUser when names change and editing is allowed', async () => {
        const admin = createOrgAdmin({ id: 'active-admin' });
        const contributor = createOrgContributor({
            id: 'edited-user',
            firstName: 'Casey',
            lastName: 'Contributor',
            email: 'casey.contributor@geti.com',
        });
        const closeDialog = jest.fn();
        const usersService = createInMemoryUsersService();

        usersService.updateUser = jest.fn(usersService.updateUser);

        await render(
            <EditOrganizationUserDialog
                organizationId={organizationId}
                user={contributor}
                users={[contributor, admin]}
                activeUser={admin}
                isSaasEnvironment={false}
                closeDialog={closeDialog}
            />,
            {
                services: { usersService },
            }
        );

        const firstNameInput = screen.getByLabelText('First name');
        const saveButton = screen.getByRole('button', { name: 'Save' });

        await userEvent.clear(firstNameInput);
        await userEvent.type(firstNameInput, 'Updated');

        expect(saveButton).toBeEnabled();

        await userEvent.click(saveButton);

        await waitFor(() => {
            expect(usersService.updateUser).toHaveBeenCalledTimes(1);
        });

        expect(usersService.updateUser).toHaveBeenCalledWith(
            organizationId,
            expect.objectContaining({
                id: contributor.id,
                firstName: 'Updated',
                lastName: contributor.lastName,
            })
        );
        expect(closeDialog).toHaveBeenCalled();
    });

    describe('role updates', () => {
        it('uses updateMemberRole when manage users roles feature flag is enabled', async () => {
            const userToEdit = createOrgAdmin({
                id: 'org-admin',
                firstName: 'Olivia',
                lastName: 'Operator',
                email: 'olivia.operator@geti.com',
            });
            const activeAdmin = createOrgAdmin({ id: 'active-admin' }, 'workspace-id-2');
            const closeDialog = jest.fn();
            const usersService = createInMemoryUsersService();

            usersService.updateMemberRole = jest.fn().mockResolvedValue(undefined);
            usersService.updateRoles = jest.fn();

            await render(
                <EditOrganizationUserDialog
                    organizationId={organizationId}
                    user={userToEdit}
                    users={[userToEdit, activeAdmin]}
                    activeUser={activeAdmin}
                    isSaasEnvironment={false}
                    closeDialog={closeDialog}
                />,
                {
                    featureFlags: { FEATURE_FLAG_MANAGE_USERS_ROLES: true },
                    services: { usersService },
                }
            );

            await userEvent.click(screen.getByTestId('roles-add-user'));
            const roleListbox = await screen.findByRole('listbox', { name: /organization role/i });
            await userEvent.click(within(roleListbox).getByRole('option', { name: /contributor/i }));

            const saveButton = screen.getByRole('button', { name: 'Save' });
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(usersService.updateMemberRole).toHaveBeenCalledTimes(1);
            });

            expect(usersService.updateMemberRole).toHaveBeenCalledWith(organizationId, userToEdit.id, {
                resourceId: organizationId,
                role: USER_ROLE.ORGANIZATION_CONTRIBUTOR,
            });
            expect(usersService.updateRoles).not.toHaveBeenCalled();
            expect(closeDialog).toHaveBeenCalled();
        });

        it('uses updateRoles when manage users roles feature flag is disabled', async () => {
            const userToEdit = createOrgAdmin({
                id: 'org-admin',
                firstName: 'Nina',
                lastName: 'Navigator',
                email: 'nina.navigator@geti.com',
            });
            const activeAdmin = createOrgAdmin({ id: 'active-admin' }, 'workspace-id-2');
            const closeDialog = jest.fn();
            const usersService = createInMemoryUsersService();

            usersService.updateRoles = jest.fn().mockResolvedValue(undefined);
            usersService.updateMemberRole = jest.fn();

            await render(
                <EditOrganizationUserDialog
                    organizationId={organizationId}
                    user={userToEdit}
                    users={[userToEdit, activeAdmin]}
                    activeUser={activeAdmin}
                    isSaasEnvironment={false}
                    closeDialog={closeDialog}
                />,
                {
                    featureFlags: { FEATURE_FLAG_MANAGE_USERS_ROLES: false },
                    services: { usersService },
                }
            );

            await userEvent.click(screen.getByTestId('roles-add-user'));
            const roleListbox = await screen.findByRole('listbox', { name: /organization role/i });
            await userEvent.click(within(roleListbox).getByRole('option', { name: /contributor/i }));

            await userEvent.click(screen.getByRole('button', { name: 'Save' }));

            await waitFor(() => {
                expect(usersService.updateRoles).toHaveBeenCalledTimes(1);
            });

            expect(usersService.updateRoles).toHaveBeenCalledWith(
                organizationId,
                userToEdit.id,
                expect.arrayContaining([
                    expect.objectContaining({
                        operation: RoleOperationDTO.DELETE,
                        role: expect.objectContaining({
                            resourceId: organizationId,
                            resourceType: ResourceTypeDTO.ORGANIZATION,
                            role: UserRoleDTO.ORGANIZATION_ADMIN,
                        }),
                    }),
                    expect.objectContaining({
                        operation: RoleOperationDTO.CREATE,
                        role: expect.objectContaining({
                            resourceId: organizationId,
                            resourceType: ResourceTypeDTO.ORGANIZATION,
                            role: UserRoleDTO.ORGANIZATION_CONTRIBUTOR,
                        }),
                    }),
                ])
            );
            expect(usersService.updateMemberRole).not.toHaveBeenCalled();
            expect(closeDialog).toHaveBeenCalled();
        });
    });

    it('disables role picker when editing the last remaining organization admin', async () => {
        const loneAdmin = createOrgAdmin({
            id: 'only-admin',
            firstName: 'Lara',
            lastName: 'Leader',
            email: 'lara.leader@geti.com',
        });

        await render(
            <EditOrganizationUserDialog
                organizationId={organizationId}
                user={loneAdmin}
                users={[loneAdmin]}
                activeUser={loneAdmin}
                isSaasEnvironment={false}
                closeDialog={jest.fn()}
            />
        );

        expect(screen.getByTestId('roles-add-user')).toBeDisabled();
    });

    it('disables role picker when active user is org contributor', async () => {
        const contributor = createOrgContributor({
            id: 'contributor',
            firstName: 'Dan',
            lastName: 'Contributor',
            email: 'dan.contributor@geti.com',
        });

        await render(
            <EditOrganizationUserDialog
                organizationId={organizationId}
                user={contributor}
                users={[contributor]}
                activeUser={contributor}
                isSaasEnvironment={false}
                closeDialog={jest.fn()}
            />
        );

        expect(screen.getByTestId('roles-add-user')).toBeDisabled();
    });
});
