// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { isOrganizationAdmin, isWorkspaceAdmin, isWorkspaceContributor } from '@geti/core/src/users/user-role-utils';
import { User, USER_ROLE, WorkspaceRole } from '@geti/core/src/users/users.interface';

export const getAvailableWorkspaceRoles = ({
    activeMember,
    targetMember,
    members,
    workspaceId,
    organizationId,
}: {
    activeMember: User;
    targetMember: User;
    members: User[];
    workspaceId: string;
    organizationId: string;
}): WorkspaceRole['role'][] => {
    const isActiveUserWorkspaceContributor = isWorkspaceContributor(activeMember, workspaceId);
    const isActiveUserOrgAdmin = isOrganizationAdmin(activeMember, organizationId);

    if (isActiveUserOrgAdmin) {
        return [USER_ROLE.WORKSPACE_ADMIN, USER_ROLE.WORKSPACE_CONTRIBUTOR];
    }

    if (isActiveUserWorkspaceContributor) {
        return [];
    }

    const isActiveUserAdmin = isWorkspaceAdmin(activeMember, workspaceId);
    const isAccountOwner = activeMember.id === targetMember.id;
    const isTargetMemberWorkspaceContributor = isWorkspaceContributor(targetMember, workspaceId);
    const atLeastTwoAdminsExist = members.filter((user) => isWorkspaceAdmin(user, workspaceId)).length >= 2;

    if (isActiveUserAdmin && (atLeastTwoAdminsExist || isTargetMemberWorkspaceContributor)) {
        return [USER_ROLE.WORKSPACE_ADMIN, USER_ROLE.WORKSPACE_CONTRIBUTOR];
    }

    if (isActiveUserAdmin && !isAccountOwner) {
        return [USER_ROLE.WORKSPACE_ADMIN, USER_ROLE.WORKSPACE_CONTRIBUTOR];
    }

    return [];
};
