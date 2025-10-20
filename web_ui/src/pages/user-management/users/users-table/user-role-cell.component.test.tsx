// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { RESOURCE_TYPE, USER_ROLE } from '@geti/core/src/users/users.interface';
import { screen } from '@testing-library/react';

import { getMockedUser } from '../../../../test-utils/mocked-items-factory/mocked-users';
import { providersRender as render } from '../../../../test-utils/required-providers-render';
import { UserRoleCell } from './user-role-cell.component';
import { USERS_TABLE_COLUMNS } from './users-table.component';

describe('UserRoleCell', () => {
    const workspaceId = 'workspace-id';
    const organizationId = 'organization-id';

    it('shows organization roles when no resourceId is provided', () => {
        const roles = [
            {
                role: USER_ROLE.ORGANIZATION_ADMIN,
                resourceId: organizationId,
                resourceType: RESOURCE_TYPE.ORGANIZATION,
            },
        ];

        render(
            <UserRoleCell
                resourceId={undefined}
                cellData={roles}
                columnIndex={0}
                dataKey={USERS_TABLE_COLUMNS.ROLES}
                rowIndex={0}
                rowData={getMockedUser({ id: 'user-id', roles })}
                isScrolling={false}
            />
        );

        expect(screen.getByTestId('user-id-roles')).toHaveTextContent('Organization admin');
    });

    it('shows workspace role for the selected workspace', () => {
        const roles = [
            {
                role: USER_ROLE.WORKSPACE_ADMIN,
                resourceId: workspaceId,
                resourceType: RESOURCE_TYPE.WORKSPACE,
            },
        ];

        render(
            <UserRoleCell
                resourceId={workspaceId}
                cellData={roles}
                columnIndex={0}
                dataKey={USERS_TABLE_COLUMNS.ROLES}
                rowIndex={0}
                rowData={getMockedUser({ id: 'user-id', roles })}
                isScrolling={false}
            />
        );

        expect(screen.getByTestId('user-id-roles')).toHaveTextContent('Workspace admin');
    });

    it('falls back to N/A when no matching workspace role exists', () => {
        const roles = [
            {
                role: USER_ROLE.WORKSPACE_CONTRIBUTOR,
                resourceId: 'different-workspace-id',
                resourceType: RESOURCE_TYPE.WORKSPACE,
            },
        ];

        render(
            <UserRoleCell
                resourceId={workspaceId}
                cellData={roles}
                columnIndex={0}
                dataKey={USERS_TABLE_COLUMNS.ROLES}
                rowIndex={0}
                rowData={getMockedUser({ id: 'user-id', roles })}
                isScrolling={false}
            />
        );

        expect(screen.getByTestId('user-id-roles')).toHaveTextContent('N/A');
    });
});
