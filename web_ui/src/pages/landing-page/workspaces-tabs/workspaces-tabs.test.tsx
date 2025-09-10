// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { createInMemoryUsersService } from '@geti/core/src/users/services/in-memory-users-service';
import { RESOURCE_TYPE, USER_ROLE } from '@geti/core/src/users/users.interface';
import { screen, within } from '@testing-library/react';

import { getMockedAdminUser } from '../../../test-utils/mocked-items-factory/mocked-users';
import { projectListRender } from '../../../test-utils/projects-list-providers-render';
import { WorkspacesTabs } from './workspaces-tabs.component';

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({
        workspaceId: 'workspace-id',
        organizationId: 'organization-123',
    }),
}));

describe('WorkspaceTabs', () => {
    it('only allows edit actions on a workspace for the selected workspace', async () => {
        const usersService = createInMemoryUsersService();
        usersService.getActiveUser = async () => {
            return getMockedAdminUser();
        };

        await projectListRender(<WorkspacesTabs />, {
            services: { usersService },
            featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: true },
        });

        const workspaces = await screen.findByRole('tablist', { name: 'Workspaces tabs' });
        expect(workspaces).toBeInTheDocument();

        const tabs = within(workspaces).getAllByRole('tab');
        expect(tabs).toHaveLength(2);

        const workspace1 = screen.getByRole('tab', { name: /Workspace 1/, selected: true });
        expect(workspace1).toBeInTheDocument();
        const workspace2 = screen.getByRole('tab', { name: /Workspace 2/, selected: false });
        expect(workspace2).toBeInTheDocument();

        expect(await within(workspace1).findByRole('button', { name: 'open menu' })).toBeInTheDocument();
        expect(within(workspace2).queryByRole('button', { name: 'open menu' })).not.toBeInTheDocument();
    });

    it('renders NoPermissionPlaceholder when user lacks CAN_SEE_WORKSPACE', async () => {
        const usersService = createInMemoryUsersService();
        usersService.getActiveUser = async () => ({
            ...getMockedAdminUser(),
            roles: [
                {
                    role: USER_ROLE.ORGANIZATION_CONTRIBUTOR,
                    resourceId: 'organization-123',
                    resourceType: RESOURCE_TYPE.ORGANIZATION,
                },
            ],
        });

        await projectListRender(<WorkspacesTabs />, {
            services: { usersService },
            featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: true },
        });

        expect(await screen.findByLabelText('No permission to view workspace')).toBeInTheDocument();
    });

    it('renders workspace content when permission passes', async () => {
        const usersService = createInMemoryUsersService();
        usersService.getActiveUser = async () => getMockedAdminUser();

        await projectListRender(<WorkspacesTabs />, {
            services: { usersService },
            featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: true },
        });

        expect(screen.queryByLabelText('No permission to view workspace')).not.toBeInTheDocument();
    });
});
