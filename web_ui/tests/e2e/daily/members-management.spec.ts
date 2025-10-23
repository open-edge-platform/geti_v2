// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { v4 as uuid } from 'uuid';

import { USER_ROLE } from '../../../packages/core/src/users/users.interface';
import { expect } from '../../fixtures/base-test';
import { MembersPage } from '../../fixtures/page-objects/members-page';
import { test } from '../fixtures';

const expectMemberToBeVisible = async (
    membersPage: MembersPage,
    member: {
        email: string;
        firstName: string;
        lastName: string;
        organizationRole: USER_ROLE.ORGANIZATION_ADMIN | USER_ROLE.ORGANIZATION_CONTRIBUTOR;
    }
) => {
    const memberRow = membersPage.getMemberRow(member.email);

    await expect(membersPage.getEmailCell(member.email, memberRow)).toBeVisible();
    await expect(membersPage.getNameCell(member.firstName, member.lastName, memberRow)).toBeVisible();
    await expect(membersPage.getRoleCell(member.organizationRole, memberRow)).toBeVisible();
};

const expectMemberNotToBeVisible = async (
    membersPage: MembersPage,
    member: {
        email: string;
        firstName: string;
        lastName: string;
        organizationRole: USER_ROLE.ORGANIZATION_ADMIN | USER_ROLE.ORGANIZATION_CONTRIBUTOR;
    }
) => {
    await expect(membersPage.getMemberRow(member.email)).toBeHidden();
};

test.describe('Members management suite', () => {
    const organizationAdminMember = {
        email: `test-admin-${uuid()}@intel.com`,
        firstName: 'Test',
        lastName: 'Admin',
        password: 'Test1234',
        organizationRole: USER_ROLE.ORGANIZATION_ADMIN,
    } as const;

    const organizationContributorMember = {
        email: `test-contributor-${uuid()}@intel.com`,
        firstName: 'Test',
        lastName: 'Contributor',
        password: 'Test1234',
        workspaceRole: USER_ROLE.WORKSPACE_CONTRIBUTOR,
        organizationRole: USER_ROLE.ORGANIZATION_CONTRIBUTOR,
    } as const;

    test.afterEach(async ({ membersPage }, testInfo) => {
        if (testInfo.status !== 'passed') {
            console.info('Cleanup');
            await membersPage.removeMember(organizationAdminMember.email);
            await membersPage.removeMember(organizationContributorMember.email);
        }
    });

    test('Members management', { tag: ['@daily'] }, async ({ membersPage, page }) => {
        await page.route('**/api/v1/product_info', async (route) => {
            const response = await route.fetch();
            const body = await response.json();
            body['smtp-defined'] = 'False';

            await route.fulfill({
                status: 200,
                body: JSON.stringify(body),
            });
        });

        await membersPage.open();

        await test.step('Creates new organization admin and organization contributor members', async () => {
            await membersPage.addMember(organizationContributorMember);

            await expectMemberToBeVisible(membersPage, organizationContributorMember);

            await membersPage.addMember(organizationAdminMember);

            await expectMemberToBeVisible(membersPage, organizationAdminMember);
        });

        await test.step('Filters by organization admin and organization contributor role', async () => {
            await membersPage.filterByRole(USER_ROLE.ORGANIZATION_ADMIN);

            await expectMemberToBeVisible(membersPage, organizationAdminMember);
            await expectMemberNotToBeVisible(membersPage, organizationContributorMember);

            await membersPage.filterByRole(USER_ROLE.ORGANIZATION_CONTRIBUTOR);

            await expectMemberToBeVisible(membersPage, organizationContributorMember);
            await expectMemberNotToBeVisible(membersPage, organizationAdminMember);

            await membersPage.filterByRole('All role');
            await expectMemberToBeVisible(membersPage, organizationAdminMember);
            await expectMemberToBeVisible(membersPage, organizationContributorMember);
        });

        await test.step("Filters by member's name and email", async () => {
            await membersPage.filterByNameOrEmail(organizationAdminMember.email);

            await expectMemberToBeVisible(membersPage, organizationAdminMember);
            await expectMemberNotToBeVisible(membersPage, organizationContributorMember);

            await membersPage.filterByNameOrEmail(organizationContributorMember.lastName);

            await expectMemberToBeVisible(membersPage, organizationContributorMember);
            await expectMemberNotToBeVisible(membersPage, organizationAdminMember);

            await membersPage.resetSearchFilter();
        });

        await test.step('Edits workspace admin and workspace contributor member', async () => {
            const updatedWorkspaceAdminMember = {
                ...organizationAdminMember,
                firstName: 'Updated',
                lastName: 'Old Admin',
                role: USER_ROLE.ORGANIZATION_CONTRIBUTOR,
            } as const;

            await membersPage.editMember(updatedWorkspaceAdminMember);

            await expectMemberToBeVisible(membersPage, updatedWorkspaceAdminMember);

            const updatedWorkspaceContributorMember = {
                ...organizationContributorMember,
                firstName: 'Updated',
                lastName: 'Old Contributor',
                role: USER_ROLE.ORGANIZATION_ADMIN,
            } as const;

            await membersPage.editMember(updatedWorkspaceContributorMember);

            await expectMemberToBeVisible(membersPage, updatedWorkspaceContributorMember);
        });

        await test.step('Removes workspace admin and workspace contributor member', async () => {
            await membersPage.removeMember(organizationContributorMember.email);

            await expectMemberNotToBeVisible(membersPage, organizationContributorMember);

            await membersPage.removeMember(organizationAdminMember.email);

            await expectMemberNotToBeVisible(membersPage, organizationAdminMember);
        });
    });
});
