// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { RESOURCE_TYPE, RoleResource, WorkspaceRole } from '@geti/core/src/users/users.interface';
import { WorkspaceEntity } from '@geti/core/src/workspaces/services/workspaces.interface';

import { hasEqualId } from '../../../../../shared/utils';

export const mapRolesToWorkspaceRoles = (roles: RoleResource[], workspaces: WorkspaceEntity[]): WorkspaceRole[] =>
    roles
        .filter((role) => role.resourceType === RESOURCE_TYPE.WORKSPACE)
        .map((role) => ({
            role: role.role as WorkspaceRole['role'],
            workspace: workspaces.find(hasEqualId(role.resourceId)) as WorkspaceEntity,
        }));
