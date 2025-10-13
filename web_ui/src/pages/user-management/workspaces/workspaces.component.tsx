// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useUsers } from '@geti/core/src/users/hook/use-users.hook';
import { Flex, Text } from '@geti/ui';

import { useOrganizationIdentifier } from '../../../hooks/use-organization-identifier/use-organization-identifier.hook';
import { useWorkspaces } from '../../../providers/workspaces-provider/workspaces-provider.component';
import { WorkspaceUsersManagement } from './workspace-users-management.component';

export const Workspaces = () => {
    const { organizationId } = useOrganizationIdentifier();
    const { useActiveUser } = useUsers();
    const { data: activeUser } = useActiveUser(organizationId);
    const { workspaces } = useWorkspaces();

    if (!activeUser) return null;

    const hasAnyWorkspace = workspaces.length > 0;

    return (
        <Flex direction={'column'} height={'100%'} gap={'size-300'}>
            <Text>
                Manage the workspaces that you have access to as part of your organization. Workspace admins can view
                and manage all projects inside a workspace, and can add users from the organization to their workspace.
                Workspace contributors can create projects and manage the projects that they have access to.
            </Text>
            {hasAnyWorkspace && <WorkspaceUsersManagement activeUser={activeUser} />}
        </Flex>
    );
};
