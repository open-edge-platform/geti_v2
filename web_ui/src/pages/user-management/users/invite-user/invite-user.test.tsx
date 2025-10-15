// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { RESOURCE_TYPE, USER_ROLE } from '@geti/core/src/users/users.interface';
import { fireEvent, screen } from '@testing-library/react';

import { getMockedWorkspaceIdentifier } from '../../../../test-utils/mocked-items-factory/mocked-identifiers';
import { getMockedAdminUser } from '../../../../test-utils/mocked-items-factory/mocked-users';
import { getMockedWorkspace } from '../../../../test-utils/mocked-items-factory/mocked-workspace';
import { providersRender as render } from '../../../../test-utils/required-providers-render';
import { InviteUserDialog } from './invite-user.component';

const mockedAdmin = getMockedAdminUser();
const mockedInviteUserMutation = jest.fn();
const mockedWorkspaceIdentifier = getMockedWorkspaceIdentifier();
const mockedInvalidateQuery = jest.fn();
const MockedWorkspace = getMockedWorkspace({ id: mockedWorkspaceIdentifier.workspaceId });

jest.mock('@tanstack/react-query', () => ({
    ...jest.requireActual('@tanstack/react-query'),
    useQueryClient: () => ({
        invalidateQueries: mockedInvalidateQuery,
    }),
}));

jest.mock('../../../../providers/workspaces-provider/workspaces-provider.component', () => ({
    ...jest.requireActual('../../../../providers/workspaces-provider/workspaces-provider.component'),
    useWorkspaces: jest.fn(() => ({
        workspaceId: mockedWorkspaceIdentifier.workspaceId,
        workspaces: [MockedWorkspace],
    })),
}));

jest.mock('@geti/core/src/users/hook/use-users.hook', () => ({
    useUsers: jest.fn(() => ({
        useGetUsersQuery: jest.fn(() => ({ data: [] })),
        useInviteUserMutation: jest.fn(() => ({ isPending: false, mutate: mockedInviteUserMutation })),
    })),
}));

describe('Invite user to the workspace', () => {
    it('Check if user invitation is sending proper roles', async () => {
        render(
            <InviteUserDialog
                isAdmin={mockedAdmin.isAdmin}
                id={mockedAdmin.id}
                organizationId={mockedWorkspaceIdentifier.organizationId}
                workspaceId={mockedWorkspaceIdentifier.workspaceId}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Send invite' }));
        const emailInput = screen.getByLabelText('Email address');
        fireEvent.change(emailInput, { target: { value: 'test@intel.com' } });

        fireEvent.submit(screen.getByRole('button', { name: 'send invitation' }));

        expect(mockedInviteUserMutation).toHaveBeenCalledWith(
            expect.objectContaining({
                roles: [
                    {
                        resourceId: mockedWorkspaceIdentifier.organizationId,
                        resourceType: RESOURCE_TYPE.ORGANIZATION,
                        role: USER_ROLE.ORGANIZATION_CONTRIBUTOR,
                    },
                    {
                        resourceId: mockedWorkspaceIdentifier.workspaceId,
                        resourceType: RESOURCE_TYPE.WORKSPACE,
                        role: USER_ROLE.WORKSPACE_CONTRIBUTOR,
                    },
                ],
            }),
            expect.objectContaining({})
        );
    });

    it('Check if admin can invite user ', async () => {
        render(
            <InviteUserDialog
                isAdmin={mockedAdmin.isAdmin}
                id={mockedAdmin.id}
                organizationId={mockedWorkspaceIdentifier.organizationId}
                workspaceId={mockedWorkspaceIdentifier.workspaceId}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Send invite' }));

        expect(screen.queryByRole('button', { name: 'Workspace', expanded: false })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Organization Role/, expanded: false }));
        expect(screen.getByRole('option', { name: USER_ROLE.ORGANIZATION_ADMIN })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: USER_ROLE.ORGANIZATION_CONTRIBUTOR })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('option', { name: USER_ROLE.ORGANIZATION_CONTRIBUTOR }));

        fireEvent.click(screen.getByRole('button', { name: /Workspace Role/, expanded: false }));
        expect(screen.getByRole('option', { name: USER_ROLE.WORKSPACE_ADMIN })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: USER_ROLE.WORKSPACE_CONTRIBUTOR })).toBeInTheDocument();
    });

    it('Check if contributor cannot invite user to the workspace', async () => {
        render(
            <InviteUserDialog
                isAdmin={false}
                id={mockedAdmin.id}
                organizationId={mockedWorkspaceIdentifier.organizationId}
                workspaceId={mockedWorkspaceIdentifier.workspaceId}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Send invite' }));

        expect(screen.queryByRole('button', { name: 'Workspace', expanded: false })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Organization Role/, expanded: false }));
        expect(screen.queryByRole('option', { name: USER_ROLE.ORGANIZATION_ADMIN })).not.toBeInTheDocument();
        expect(screen.getByRole('option', { name: USER_ROLE.ORGANIZATION_CONTRIBUTOR })).toBeInTheDocument();
    });
});
