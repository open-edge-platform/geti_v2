// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Key, useState } from 'react';

import { isOrganizationAdmin, isWorkspaceAdmin, isWorkspaceContributor } from '@geti/core/src/users/user-role-utils';
import { User } from '@geti/core/src/users/users.interface';
import { DialogContainer } from '@geti/ui';
import { Delete, Edit } from '@geti/ui/icons';
import { isEmpty } from 'lodash-es';

import { useOrganizationIdentifier } from '../../../../../hooks/use-organization-identifier/use-organization-identifier.hook';
import { ActionMenu } from '../../../../../shared/components/action-menu/action-menu.component';
import { MenuAction } from '../../../../../shared/components/action-menu/menu-action.interface';
import { HasPermission } from '../../../../../shared/components/has-permission/has-permission.component';
import { OPERATION } from '../../../../../shared/components/has-permission/has-permission.interface';
import { EditWorkspaceUserDialog } from './edit-workspace-user-dialog.component';
import { RemoveFromWorkspaceDialog } from './remove-from-workspace-dialog.component';

enum USER_ACTIONS_OPTIONS {
    EDIT = 'Edit',
    REMOVE_FROM_WORKSPACE = 'Remove from workspace',
}

interface UserActionsProps {
    activeUser: User;
    user: User;
    users: User[];
    workspaceId?: string;
}

export const WorkspaceUserActions = ({ activeUser, user, users, workspaceId }: UserActionsProps) => {
    const { organizationId } = useOrganizationIdentifier();

    const [action, setAction] = useState<USER_ACTIONS_OPTIONS | undefined>(undefined);

    const onAction = (key: Key) => setAction(key as USER_ACTIONS_OPTIONS);

    const clearAction = () => setAction(undefined);

    const isOwnAccount = user.id === activeUser?.id;
    const isActiveUserOrgAdmin = isOrganizationAdmin(activeUser, organizationId);
    const isActiveMemberWorkspaceContributor = workspaceId ? isWorkspaceContributor(activeUser, workspaceId) : false;
    const isActiveUserWorkspaceAdmin = workspaceId ? isWorkspaceAdmin(activeUser, workspaceId) : false;

    const editAction = {
        id: USER_ACTIONS_OPTIONS.EDIT,
        name: USER_ACTIONS_OPTIONS.EDIT,
        icon: <Edit />,
    };

    const removeFromWorkspaceAction = {
        id: USER_ACTIONS_OPTIONS.REMOVE_FROM_WORKSPACE,
        name: USER_ACTIONS_OPTIONS.REMOVE_FROM_WORKSPACE,
        icon: <Delete />,
    };

    const canContributorEdit = (isOwnAccount && !workspaceId) || (isActiveMemberWorkspaceContributor && isOwnAccount);
    const canEditUserRole =
        isActiveUserOrgAdmin || canContributorEdit || activeUser.isAdmin || isActiveUserWorkspaceAdmin;

    const workspaceAdmins = workspaceId ? users.filter((u) => isWorkspaceAdmin(u, workspaceId)) : [];
    const isTargetWorkspaceAdmin = workspaceId ? isWorkspaceAdmin(user, workspaceId) : false;
    const isLastWorkspaceAdmin = workspaceId && isTargetWorkspaceAdmin && workspaceAdmins.length === 1;

    const canRemoveFromWorkspace =
        !!workspaceId &&
        (isActiveUserWorkspaceAdmin || isActiveUserOrgAdmin) &&
        !isOwnAccount &&
        (!isLastWorkspaceAdmin || !isTargetWorkspaceAdmin);

    const editActionItem = canEditUserRole ? editAction : undefined;
    const removeFromWorkspaceItem = canRemoveFromWorkspace ? removeFromWorkspaceAction : undefined;

    const items = [editActionItem, removeFromWorkspaceItem].filter(
        (item) => !!item
    ) as MenuAction<USER_ACTIONS_OPTIONS>[];

    if (isEmpty(items)) {
        return <></>;
    }

    //Note: specialCondition is used to allow user edit/delete him/herself
    return (
        <HasPermission
            operations={[OPERATION.MANAGE_USER]}
            // Allow showing the menu for:
            //  - the active user (self)
            //  - workspace admins of the current workspace
            //  - organization admins (even if only a workspace contributor)
            specialCondition={isOwnAccount || isActiveUserWorkspaceAdmin || isActiveUserOrgAdmin}
        >
            <ActionMenu
                items={items}
                id={`${user.id}-user-action-menu`}
                onAction={onAction}
                ariaLabel={`${user.email} action menu`}
            />
            <DialogContainer onDismiss={clearAction}>
                {action === USER_ACTIONS_OPTIONS.REMOVE_FROM_WORKSPACE && workspaceId && (
                    <RemoveFromWorkspaceDialog
                        organizationId={organizationId}
                        workspaceId={workspaceId}
                        user={user}
                        onAfterRemove={clearAction}
                    />
                )}
                {action === USER_ACTIONS_OPTIONS.EDIT && workspaceId && (
                    <EditWorkspaceUserDialog
                        organizationId={organizationId}
                        workspaceId={workspaceId}
                        user={user}
                        activeUser={activeUser}
                        closeDialog={clearAction}
                        users={users}
                    />
                )}
            </DialogContainer>
        </HasPermission>
    );
};
