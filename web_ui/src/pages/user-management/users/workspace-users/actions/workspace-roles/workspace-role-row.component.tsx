// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { USER_ROLE, WorkspaceRole } from '@geti/core/src/users/users.interface';
import { WorkspaceEntity } from '@geti/core/src/workspaces/services/workspaces.interface';
import { ActionButton, Flex } from '@geti/ui';
import { Close } from '@geti/ui/icons';

import { RolePicker } from '../../../old-project-users/role-picker.component';
import { WorkspacesPicker } from './workspaces-picker.component';

interface WorkspaceRoleProps {
    workspaceRole: WorkspaceRole;
    changeWorkspace: (value: WorkspaceEntity) => void;
    changeRole: (value: WorkspaceRole['role']) => void;
    deleteWorkspaceRole: () => void;
    workspaces: WorkspaceEntity[];
    deletable?: boolean;
    isEditable?: boolean;
}
export const WorkspaceRoleRow = ({
    workspaceRole,
    deleteWorkspaceRole,
    changeWorkspace,
    changeRole,
    workspaces,
    deletable = false,
    isEditable = true,
}: WorkspaceRoleProps) => {
    const { workspace, role } = workspaceRole;

    return (
        <Flex alignItems={'end'} gap={'size-200'} key={`${workspace.name}-row`}>
            <WorkspacesPicker
                selectedWorkspace={workspace}
                workspaces={[...workspaces, workspace]}
                changeWorkspace={changeWorkspace}
                width={'calc(50% - 32px)'}
                isDisabled={!isEditable}
            />
            <RolePicker
                roles={[USER_ROLE.WORKSPACE_CONTRIBUTOR, USER_ROLE.WORKSPACE_ADMIN]}
                selectedRole={role}
                setSelectedRole={changeRole}
                width={'calc(50% - 32px)'}
                isDisabled={!isEditable}
            />
            {deletable && (
                <ActionButton onPress={deleteWorkspaceRole} isDisabled={!isEditable}>
                    <Close />
                </ActionButton>
            )}
        </Flex>
    );
};
