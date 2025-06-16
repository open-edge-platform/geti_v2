// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { createInMemoryUsersService } from '@geti/core/src/users/services/in-memory-users-service';
import { RESOURCE_TYPE, USER_ROLE } from '@geti/core/src/users/users.interface';
import { createInMemoryApiWorkspacesService } from '@geti/core/src/workspaces/services/in-memory-api-workspaces-service';
import { screen } from '@testing-library/react';

import { getMockedUser } from '../../../test-utils/mocked-items-factory/mocked-users';
import { getMockedWorkspace } from '../../../test-utils/mocked-items-factory/mocked-workspace';
import { providersRender as render } from '../../../test-utils/required-providers-render';
import { Workspaces } from './workspaces.component';

const mockedOrganizationId = 'test-organization';

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: jest.fn(() => ({
        workspaceId: '1',
        organizationId: mockedOrganizationId,
    })),
}));

describe('Workspaces', () => {
    const mockedWorkspace = getMockedWorkspace({ id: '1', name: 'Workspace 1' });
    const mockedWorkspace2 = getMockedWorkspace({ id: '2', name: 'Workspace 2' });

    it('Check if there are two workspaces displayed', async () => {
        const workspacesService = createInMemoryApiWorkspacesService();
        const usersService = createInMemoryUsersService();

        const mockedWorkspaces = [mockedWorkspace, mockedWorkspace2];

        workspacesService.getWorkspaces = async () => {
            return Promise.resolve(mockedWorkspaces);
        };
        usersService.getActiveUser = jest.fn(async () => getMockedUser());

        render(<Workspaces />, {
            services: { workspacesService, usersService },
        });

        expect(await screen.findByText('Workspace 1')).toBeInTheDocument();
        expect(await screen.findByText('Workspace 2')).toBeInTheDocument();
    });

    it('Check if add workspace button is visible when user is organization contributor - FEATURE_FLAG_WORKSPACE_ACTIONS on', async () => {
        const workspacesService = createInMemoryApiWorkspacesService();
        const usersService = createInMemoryUsersService();

        workspacesService.getWorkspaces = async () => {
            return Promise.resolve([]);
        };

        const mockedContributorUser = getMockedUser({
            roles: [
                {
                    resourceType: RESOURCE_TYPE.ORGANIZATION,
                    resourceId: mockedOrganizationId,
                    role: USER_ROLE.ORGANIZATION_CONTRIBUTOR,
                },
            ],
        });
        usersService.getActiveUser = async () => Promise.resolve(mockedContributorUser);

        render(<Workspaces />, {
            services: { workspacesService, usersService },
            featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: true },
        });

        expect(await screen.findByRole('button', { name: 'Create new workspace' })).toBeInTheDocument();
    });

    it('Check if add workspace button is visible when user is organization admin - FEATURE_FLAG_WORKSPACE_ACTIONS on', async () => {
        const workspacesService = createInMemoryApiWorkspacesService();
        const usersService = createInMemoryUsersService();

        workspacesService.getWorkspaces = async () => {
            return Promise.resolve([]);
        };

        const mockedAdminUser = getMockedUser({
            roles: [
                {
                    resourceId: mockedOrganizationId,
                    resourceType: RESOURCE_TYPE.ORGANIZATION,
                    role: USER_ROLE.ORGANIZATION_ADMIN,
                },
            ],
        });

        usersService.getActiveUser = async () => Promise.resolve(mockedAdminUser);

        render(<Workspaces />, {
            services: { workspacesService, usersService },
            featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: true },
        });
        expect(await screen.findByRole('button', { name: 'Create new workspace' })).toBeInTheDocument();
    });

    it('Check if add workspace button is not visible when user is not organization user - FEATURE_FLAG_WORKSPACE_ACTIONS on', async () => {
        const workspacesService = createInMemoryApiWorkspacesService();
        const usersService = createInMemoryUsersService();

        workspacesService.getWorkspaces = async () => {
            return Promise.resolve([]);
        };

        const mockedUserFromOutsideTheOrg = getMockedUser({
            roles: [],
        });

        usersService.getActiveUser = async () => Promise.resolve(mockedUserFromOutsideTheOrg);

        render(<Workspaces />, {
            services: { workspacesService, usersService },
            featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: true },
        });
        expect(screen.queryByRole('button', { name: 'Create new workspace' })).not.toBeInTheDocument();
    });
});
