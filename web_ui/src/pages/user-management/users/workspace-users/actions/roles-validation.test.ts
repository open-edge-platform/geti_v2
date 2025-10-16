// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { RESOURCE_TYPE, USER_ROLE } from '@geti/core/src/users/users.interface';

import { getMockedUser } from '../../../../../test-utils/mocked-items-factory/mocked-users';
import { getAvailableWorkspaceRoles } from './roles-validation';

describe('roles-validation', () => {
    describe('getAvailableWorkspaceRoles', () => {
        const workspaceId = 'workspace-id';
        const organizationId = 'organization-id';

        test('Returns no roles when active member is a workspace contributor without org admin privileges', () => {
            const activeMemberContributor = getMockedUser({
                roles: [
                    {
                        resourceType: RESOURCE_TYPE.WORKSPACE,
                        role: USER_ROLE.WORKSPACE_CONTRIBUTOR,
                        resourceId: workspaceId,
                    },
                ],
            });

            const targetMember = getMockedUser({
                roles: [
                    {
                        resourceType: RESOURCE_TYPE.WORKSPACE,
                        role: USER_ROLE.WORKSPACE_CONTRIBUTOR,
                        resourceId: workspaceId,
                    },
                ],
            });

            const members = [activeMemberContributor, targetMember];

            expect(
                getAvailableWorkspaceRoles({
                    activeMember: activeMemberContributor,
                    targetMember,
                    members,
                    workspaceId,
                    organizationId,
                })
            ).toEqual([]);
        });

        test('Returns no roles when there is only one user', () => {
            const activeMemberAdmin = getMockedUser({
                roles: [
                    {
                        resourceType: RESOURCE_TYPE.WORKSPACE,
                        role: USER_ROLE.WORKSPACE_ADMIN,
                        resourceId: workspaceId,
                    },
                ],
            });

            const members = [activeMemberAdmin];

            expect(
                getAvailableWorkspaceRoles({
                    activeMember: activeMemberAdmin,
                    targetMember: activeMemberAdmin,
                    members,
                    workspaceId,
                    organizationId,
                })
            ).toEqual([]);
        });

        test('Returns no roles for active workspace admin editing themselves when they are the only workspace admin', () => {
            const activeMemberAdmin = getMockedUser({
                roles: [
                    {
                        resourceType: RESOURCE_TYPE.WORKSPACE,
                        role: USER_ROLE.WORKSPACE_ADMIN,
                        resourceId: workspaceId,
                    },
                ],
            });

            const workspaceContributor = getMockedUser({
                roles: [
                    {
                        resourceType: RESOURCE_TYPE.WORKSPACE,
                        role: USER_ROLE.WORKSPACE_CONTRIBUTOR,
                        resourceId: workspaceId,
                    },
                ],
            });

            const members = [activeMemberAdmin, workspaceContributor];

            expect(
                getAvailableWorkspaceRoles({
                    activeMember: activeMemberAdmin,
                    targetMember: activeMemberAdmin,
                    members,
                    workspaceId,
                    organizationId,
                })
            ).toEqual([]);
        });

        test('Returns roles for workspace admin editing a contributor', () => {
            const activeMemberAdmin = getMockedUser({
                roles: [
                    {
                        resourceType: RESOURCE_TYPE.WORKSPACE,
                        role: USER_ROLE.WORKSPACE_ADMIN,
                        resourceId: workspaceId,
                    },
                ],
            });

            const targetMember = getMockedUser({
                roles: [
                    {
                        resourceType: RESOURCE_TYPE.WORKSPACE,
                        role: USER_ROLE.WORKSPACE_CONTRIBUTOR,
                        resourceId: workspaceId,
                    },
                ],
            });

            const members = [activeMemberAdmin, targetMember];

            expect(
                getAvailableWorkspaceRoles({
                    activeMember: activeMemberAdmin,
                    targetMember,
                    members,
                    workspaceId,
                    organizationId,
                })
            ).toEqual([USER_ROLE.WORKSPACE_ADMIN, USER_ROLE.WORKSPACE_CONTRIBUTOR]);
        });

        test('Returns roles for workspace admin editing themselves when at least two admins exist', () => {
            const activeMemberAdmin = getMockedUser({
                roles: [
                    {
                        resourceType: RESOURCE_TYPE.WORKSPACE,
                        role: USER_ROLE.WORKSPACE_ADMIN,
                        resourceId: workspaceId,
                    },
                ],
            });

            const secondWorkspaceAdmin = getMockedUser({
                roles: [
                    {
                        resourceType: RESOURCE_TYPE.WORKSPACE,
                        role: USER_ROLE.WORKSPACE_ADMIN,
                        resourceId: workspaceId,
                    },
                ],
            });

            const workspaceContributor = getMockedUser({
                roles: [
                    {
                        resourceType: RESOURCE_TYPE.WORKSPACE,
                        role: USER_ROLE.WORKSPACE_CONTRIBUTOR,
                        resourceId: workspaceId,
                    },
                ],
            });

            const members = [activeMemberAdmin, secondWorkspaceAdmin, workspaceContributor];

            expect(
                getAvailableWorkspaceRoles({
                    activeMember: activeMemberAdmin,
                    targetMember: activeMemberAdmin,
                    members,
                    workspaceId,
                    organizationId,
                })
            ).toEqual([USER_ROLE.WORKSPACE_ADMIN, USER_ROLE.WORKSPACE_CONTRIBUTOR]);
        });
    });
});
