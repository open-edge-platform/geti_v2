// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { USER_ROLE, WorkspaceRole } from '@geti/core/src/users/users.interface';
import { WorkspaceEntity } from '@geti/core/src/workspaces/services/workspaces.interface';
import { Button } from '@geti/ui';

import { useUserRoles } from './user-user-roles.hook';
import { getUpdatedWorkspaceRoles } from './utils';
import { WorkspaceRoleRow } from './workspace-role-row.component';

interface WorkspaceRolesProps {
    workspaceRoles: WorkspaceRole[];
    setWorkspaceRoles: (workspaces: WorkspaceRole[]) => void;
    workspaces: WorkspaceEntity[];
    isOrgAdmin: boolean;
    editableWorkspaceIds?: string[];
}

export const WorkspaceRolesContainer = ({
    workspaceRoles,
    setWorkspaceRoles,
    workspaces,
    isOrgAdmin,
    editableWorkspaceIds = [],
}: WorkspaceRolesProps) => {
    const { canAddNewRole, availableWorkspaces } = useUserRoles(workspaces, workspaceRoles);

    const deleteWorkspaceRole = (index: number) => {
        const roles = [...workspaceRoles];

        roles.splice(index, 1);

        setWorkspaceRoles(roles);
    };

    const changeWorkspace = (value: WorkspaceEntity, index: number) => {
        const editedData = { workspace: value, role: workspaceRoles[index].role };

        setWorkspaceRoles(getUpdatedWorkspaceRoles(editedData, index, workspaceRoles));
    };

    const changeRole = (value: WorkspaceRole['role'], index: number) => {
        const editedData = { workspace: workspaceRoles[index].workspace, role: value };

        setWorkspaceRoles(getUpdatedWorkspaceRoles(editedData, index, workspaceRoles));
    };

    const addWorkspaceRole = () => {
        // Prefer adding a role for a workspace the editor can manage
        const preferred =
            availableWorkspaces.find((w) => editableWorkspaceIds.includes(w.id)) ?? availableWorkspaces[0];
        setWorkspaceRoles([...workspaceRoles, { workspace: preferred, role: USER_ROLE.WORKSPACE_ADMIN }]);
    };

    return (
        <>
            {workspaceRoles.map((workspaceRole, index) => {
                const isEditable = isOrgAdmin || editableWorkspaceIds.includes(workspaceRole.workspace.id);
                const canDeleteThisRow =
                    workspaceRoles.length > 1 ||
                    // allow deleting the only role to remove user from this workspace when editor has rights
                    (workspaceRoles.length === 1 && isEditable);
                return (
                    <WorkspaceRoleRow
                        key={`${workspaceRole.workspace.id}-${workspaceRole.role}`}
                        workspaceRole={workspaceRole}
                        changeWorkspace={(value) => changeWorkspace(value, index)}
                        changeRole={(value) => changeRole(value, index)}
                        deleteWorkspaceRole={() => deleteWorkspaceRole(index)}
                        workspaces={availableWorkspaces}
                        deletable={canDeleteThisRow}
                        isEditable={isEditable}
                    />
                );
            })}

            <Button
                variant={'primary'}
                onPress={addWorkspaceRole}
                isDisabled={
                    !canAddNewRole ||
                    (!isOrgAdmin && !availableWorkspaces.some((w) => editableWorkspaceIds.includes(w.id)))
                }
                marginTop={'size-175'}
            >
                Add workspace role
            </Button>
        </>
    );
};
