// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { createInMemoryUsersService } from '@geti/core/src/users/services/in-memory-users-service';
import { User } from '@geti/core/src/users/users.interface';
import { createInMemoryApiWorkspacesService } from '@geti/core/src/workspaces/services/in-memory-api-workspaces-service';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getMockedAdminUser, getMockedContributorUser } from '../../../test-utils/mocked-items-factory/mocked-users';
import { getMockedWorkspace } from '../../../test-utils/mocked-items-factory/mocked-workspace';
import { providersRender } from '../../../test-utils/required-providers-render';
import { WorkspaceUsersToolbar } from './workspace-users-toolbar.component';

const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: (...args: unknown[]) => mockUseParams(...args),
}));

jest.mock('../../../hooks/use-organization-identifier/use-organization-identifier.hook', () => ({
    useOrganizationIdentifier: () => ({ organizationId: 'org-123' }),
}));

const workspaces = [
    getMockedWorkspace({ id: 'workspace-1', name: 'Workspace 1' }),
    getMockedWorkspace({ id: 'workspace-2', name: 'Workspace 2' }),
];

const organizationId = 'org-123';

const createUsersServiceWithActiveUser = (activeUser: User) => {
    const usersService = createInMemoryUsersService();
    usersService.getActiveUser = jest.fn().mockResolvedValue(activeUser);

    return usersService;
};

describe('WorkspaceUsersToolbar', () => {
    beforeEach(() => {
        mockUseParams.mockReturnValue({ organizationId, workspaceId: workspaces[0].id });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders a tab for each workspace and highlights the selected workspace', async () => {
        const workspacesService = createInMemoryApiWorkspacesService();
        workspacesService.getWorkspaces = jest.fn().mockResolvedValue(workspaces);
        providersRender(
            <WorkspaceUsersToolbar
                workspaces={workspaces}
                selectedWorkspaceId={workspaces[0].id}
                onSelectWorkspace={jest.fn()}
            />,
            {
                featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: false },
                services: { workspacesService },
            }
        );

        const tabs = await screen.findAllByRole('tab');
        expect(tabs).toHaveLength(workspaces.length);

        workspaces.forEach((workspace) => {
            expect(screen.getByRole('tab', { name: workspace.name })).toBeInTheDocument();
        });

        expect(screen.getByRole('tab', { name: workspaces[0].name })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tab', { name: workspaces[1].name })).not.toHaveAttribute('aria-selected', 'true');
    });

    it('hides workspace actions when the feature flag is disabled', async () => {
        const workspacesService = createInMemoryApiWorkspacesService();
        workspacesService.getWorkspaces = jest.fn().mockResolvedValue(workspaces);
        providersRender(
            <WorkspaceUsersToolbar
                workspaces={workspaces}
                selectedWorkspaceId={workspaces[0].id}
                onSelectWorkspace={jest.fn()}
            />,
            {
                featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: false },
                services: { workspacesService },
            }
        );

        await screen.findAllByRole('tab');

        expect(screen.queryByRole('button', { name: 'Create workspace' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /open menu/i })).not.toBeInTheDocument();
    });

    it('shows workspace actions when flag and permissions allow it', async () => {
        const workspacesService = createInMemoryApiWorkspacesService();
        workspacesService.getWorkspaces = jest.fn().mockResolvedValue(workspaces);
        mockUseParams.mockReturnValue({ organizationId, workspaceId: workspaces[0].id });
        const adminUser = getMockedAdminUser({}, workspaces[0].id, true, organizationId);
        const usersService = createUsersServiceWithActiveUser(adminUser);

        providersRender(
            <WorkspaceUsersToolbar
                workspaces={workspaces}
                selectedWorkspaceId={workspaces[0].id}
                onSelectWorkspace={jest.fn()}
            />,
            {
                featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: true },
                services: { workspacesService, usersService },
            }
        );

        await screen.findAllByRole('tab');

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /open menu/i })).toBeVisible();
        });

        expect(screen.getByRole('button', { name: 'Create workspace' })).toBeVisible();
    });

    it('renders fallback when permissions fail even with the feature flag enabled', async () => {
        const workspacesService = createInMemoryApiWorkspacesService();
        workspacesService.getWorkspaces = jest.fn().mockResolvedValue(workspaces);
        const nonAdminUser = getMockedContributorUser({}, workspaces[0].id);
        const usersService = createUsersServiceWithActiveUser(nonAdminUser);

        providersRender(
            <WorkspaceUsersToolbar
                workspaces={workspaces}
                selectedWorkspaceId={workspaces[0].id}
                onSelectWorkspace={jest.fn()}
            />,
            {
                featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: true },
                services: { workspacesService, usersService },
            }
        );

        await screen.findAllByRole('tab');

        expect(screen.queryByRole('button', { name: /open menu/i })).not.toBeInTheDocument();
    });

    it('opens the create workspace dialog when the action button is pressed', async () => {
        const workspacesService = createInMemoryApiWorkspacesService();
        workspacesService.getWorkspaces = jest.fn().mockResolvedValue(workspaces);
        const adminUser = getMockedAdminUser({}, workspaces[0].id, true, organizationId);
        const usersService = createUsersServiceWithActiveUser(adminUser);

        providersRender(
            <WorkspaceUsersToolbar
                workspaces={workspaces}
                selectedWorkspaceId={workspaces[0].id}
                onSelectWorkspace={jest.fn()}
            />,
            {
                featureFlags: { FEATURE_FLAG_WORKSPACE_ACTIONS: true },
                services: { workspacesService, usersService },
            }
        );

        await screen.findAllByRole('tab');

        const createButton = await screen.findByRole('button', { name: 'Create workspace' });
        await userEvent.click(createButton);

        expect(await screen.findByText('Create a new workspace')).toBeInTheDocument();
    });
});
