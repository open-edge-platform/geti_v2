// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { paths } from '@geti/core';
import { expect, Locator, Page } from '@playwright/test';

import { USER_ROLE } from '../../../packages/core/src/users/users.interface';

export class MembersPage {
    constructor(private page: Page) {}

    async open() {
        await this.page.goto('/');

        await this.page.getByRole('link', { name: 'Account' }).click();
        await this.page.getByRole('tab', { name: 'Users' }).click();
    }

    async openByURL(organizationId: string) {
        await this.page.goto(paths.account.users.index({ organizationId }));
    }

    get addMemberButton() {
        return this.page.getByRole('button', { name: 'Add user', exact: true });
    }

    get membersTable() {
        return this.page.getByLabel('Users table');
    }

    get membersTableCount() {
        return (
            this.membersTable
                .getByRole('rowgroup')
                .getByRole('row')
                // filter out table header
                .filter({ has: this.page.getByTestId(/-email/) })
        );
    }

    async addMember(member: {
        email: string;
        firstName: string;
        lastName: string;
        workspaceRole?: USER_ROLE.WORKSPACE_ADMIN | USER_ROLE.WORKSPACE_CONTRIBUTOR;
        organizationRole: USER_ROLE.ORGANIZATION_ADMIN | USER_ROLE.ORGANIZATION_CONTRIBUTOR;
        password: string;
    }) {
        await this.addMemberButton.click();

        await expect(this.page.getByRole('heading', { name: /add user/i })).toBeVisible();

        await this.page.getByRole('textbox', { name: /email address/i }).fill(member.email);
        await this.page.getByRole('textbox', { name: /first name/i }).fill(member.firstName);
        await this.page.getByRole('textbox', { name: /last name/i }).fill(member.lastName);
        await this.page.getByRole('button', { name: /Organization contributor/i }).click();
        await this.page.getByRole('option', { name: member.organizationRole }).click();

        if (member.organizationRole === USER_ROLE.ORGANIZATION_CONTRIBUTOR) {
            await this.page.getByRole('button', { name: 'Default workspace Workspace' }).click();
            await this.page.getByRole('option', { name: 'Default workspace' }).click();
            await this.page.getByRole('button', { name: 'Workspace contributor' }).click();
            await this.page.getByRole('option', { name: member.workspaceRole }).click();
        }

        await this.page.getByLabel('Password', { exact: true }).fill(member.password);
        await this.page.getByLabel('Confirm password').fill(member.password);

        await this.page.getByRole('button', { name: 'save add user' }).click();
    }

    private getActionMenuButton(email: string) {
        return this.page.getByRole('button', { name: new RegExp(`${email} organization user action menu`) });
    }

    async removeMember(email: string) {
        const menuButton = this.getActionMenuButton(email);

        const isMenuButtonVisible = await menuButton.isVisible();

        if (!isMenuButtonVisible) {
            return;
        }

        await this.getActionMenuButton(email).click();

        await this.page.getByRole('menuitem', { name: /delete/i }).click();
        await this.page.getByRole('button', { name: /delete/i }).click();
    }

    getMemberRow(email: string) {
        return this.page.getByRole('row').filter({ has: this.page.getByText(email) });
    }

    getEmailCell(email: string, locator?: Locator) {
        return (locator ?? this.page).getByText(email);
    }

    getNameCell(firstName: string, lastName: string, locator?: Locator) {
        return (locator ?? this.page).getByText(`${lastName}, ${firstName}`);
    }

    getRoleCell(role: USER_ROLE, locator?: Locator) {
        return (locator ?? this.page).getByText(role, { exact: true });
    }

    async filterByRole(role: USER_ROLE | 'All role') {
        await this.page.getByTestId('users-header-role-picker').click();
        await this.page.getByRole('option', { name: role }).click();
    }

    get searchByNameOrEmailField() {
        return this.page.getByRole('searchbox', { name: /search by name/i });
    }

    async filterByNameOrEmail(searchTerm: string) {
        await this.searchByNameOrEmailField.fill(searchTerm);
    }

    async resetSearchFilter() {
        await this.searchByNameOrEmailField.fill('');
    }

    async editMember(member: { email: string; firstName?: string; lastName?: string; organizationRole?: USER_ROLE }) {
        await this.getActionMenuButton(member.email).click();

        await this.page.getByRole('menuitem', { name: /edit/i }).click();

        if (member.firstName !== undefined) {
            await this.page.getByRole('textbox', { name: /first name/i }).fill(member.firstName);
        }

        if (member.lastName !== undefined) {
            await this.page.getByRole('textbox', { name: /last name/i }).fill(member.lastName);
        }

        if (member.organizationRole !== undefined) {
            await this.page.getByTestId('roles-add-user').click();
            await this.page.getByRole('option', { name: member.organizationRole }).click();
        }

        await this.page.getByRole('button', { name: /save/i }).click();
    }
}
