// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Key, useState } from 'react';

import { isOrganizationAdmin } from '@geti/core/src/users/user-role-utils';
import { User } from '@geti/core/src/users/users.interface';
import { DialogContainer } from '@geti/ui';
import { Delete, Edit } from '@geti/ui/icons';
import { isEmpty } from 'lodash-es';

import { useIsSaasEnv } from '../../../../hooks/use-is-saas-env/use-is-saas-env.hook';
import { useOrganizationIdentifier } from '../../../../hooks/use-organization-identifier/use-organization-identifier.hook';
import { ActionMenu } from '../../../../shared/components/action-menu/action-menu.component';
import { MenuAction } from '../../../../shared/components/action-menu/menu-action.interface';
import { HasPermission } from '../../../../shared/components/has-permission/has-permission.component';
import { OPERATION } from '../../../../shared/components/has-permission/has-permission.interface';
import { EditOrganizationUserDialog } from './edit-organization-user-dialog.component';
import { RemoveUserDialog } from './remove-user-dialog.component';

enum ORG_USER_ACTIONS_OPTIONS {
    DELETE = 'Delete from organization',
    EDIT = 'Edit',
}

interface OrganizationUserActionsProps {
    activeUser: User;
    user: User;
    users: User[];
}

export const OrganizationUserActions = ({ activeUser, user, users }: OrganizationUserActionsProps) => {
    const { organizationId } = useOrganizationIdentifier();
    const isSaasEnvironment = useIsSaasEnv();
    const [action, setAction] = useState<ORG_USER_ACTIONS_OPTIONS | undefined>(undefined);

    const onAction = (key: Key) => setAction(key as ORG_USER_ACTIONS_OPTIONS);
    const clearAction = () => setAction(undefined);

    const isOwnAccount = user.id === activeUser.id;
    const isActiveUserOrgAdmin = isOrganizationAdmin(activeUser, organizationId);

    // Org-level edit: allowed if actor is org admin OR editing self (names only)
    const canEdit = isActiveUserOrgAdmin || isOwnAccount;
    // Delete allowed only if actor is org admin and NOT deleting self
    const canDelete = isActiveUserOrgAdmin && !isOwnAccount;

    const editAction = canEdit
        ? { id: ORG_USER_ACTIONS_OPTIONS.EDIT, name: ORG_USER_ACTIONS_OPTIONS.EDIT, icon: <Edit /> }
        : undefined;
    const deleteAction = canDelete
        ? { id: ORG_USER_ACTIONS_OPTIONS.DELETE, name: ORG_USER_ACTIONS_OPTIONS.DELETE, icon: <Delete /> }
        : undefined;

    const items = [editAction, deleteAction].filter(Boolean) as MenuAction<ORG_USER_ACTIONS_OPTIONS>[];
    if (isEmpty(items)) return <></>;

    return (
        <HasPermission operations={[OPERATION.MANAGE_USER]} specialCondition={isOwnAccount || isActiveUserOrgAdmin}>
            <ActionMenu
                items={items}
                id={`${user.id}-org-user-action-menu`}
                onAction={onAction}
                ariaLabel={`${user.email} organization user action menu`}
            />
            <DialogContainer onDismiss={clearAction}>
                {action === ORG_USER_ACTIONS_OPTIONS.DELETE && (
                    <RemoveUserDialog organizationId={organizationId} user={user} activeUser={activeUser} />
                )}
                {action === ORG_USER_ACTIONS_OPTIONS.EDIT && (
                    <EditOrganizationUserDialog
                        organizationId={organizationId}
                        user={user}
                        users={users}
                        activeUser={activeUser}
                        isSaasEnvironment={isSaasEnvironment}
                        closeDialog={clearAction}
                    />
                )}
            </DialogContainer>
        </HasPermission>
    );
};
