// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useState } from 'react';

import { User } from '@geti/core/src/users/users.interface';
import { Flex } from '@geti/ui';

import { useWorkspaces } from '../../../providers/workspaces-provider/workspaces-provider.component';
import { WorkspaceUsers } from '../users/workspace-users/workspace-users.component';
import { WorkspaceUsersToolbar } from './workspace-users-toolbar.component';

export const WorkspaceUsersManagement = ({ activeUser }: { activeUser: User }) => {
    const { workspaces } = useWorkspaces();
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | undefined>(workspaces[0]?.id);

    return (
        <Flex direction={'column'} gap={'size-200'} height={'100%'}>
            <WorkspaceUsersToolbar
                workspaces={workspaces}
                selectedWorkspaceId={selectedWorkspaceId}
                onSelectWorkspace={setSelectedWorkspaceId}
            />
            {selectedWorkspaceId && <WorkspaceUsers activeUser={activeUser} workspaceId={selectedWorkspaceId} />}
        </Flex>
    );
};
