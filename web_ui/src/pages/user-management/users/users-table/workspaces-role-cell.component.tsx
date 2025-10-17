// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { RESOURCE_TYPE, Role } from '@geti/core/src/users/users.interface';
import { Workspace } from '@geti/core/src/workspaces/services/workspaces.interface';
import { capitalize, isEmpty } from 'lodash-es';

import { CasualCell } from '../../../../shared/components/table/components/casual-cell/casual-cell.component';
import { TableCellProps } from '../../../../shared/components/table/table.interface';
import { WorkspaceRoleTooltipContent } from '../../../../shared/components/tooltips/workspace-role-tooltip';

interface WorkspacesRoleCellProps extends Omit<TableCellProps, 'cellData'> {
    workspaceId: string | undefined;
    workspaces: Workspace[];
    cellData: Role[];
}

export const WorkspacesRoleCell = ({ cellData, workspaceId, workspaces, ...rest }: WorkspacesRoleCellProps) => {
    const workspaceRoles = cellData.filter((role) => role.resourceType === RESOURCE_TYPE.WORKSPACE);

    const selectedWorkspaceRole = capitalize(
        workspaceRoles.find((role) => role.resourceId === workspaceId)?.role ?? ''
    );
    const availableWorkspaces = workspaceRoles
        .map((role) => workspaces.find((workspace) => workspace.id === role.resourceId)?.name ?? role.resourceId)
        .join(', ');

    const rolesWorkspacesCellData = !isEmpty(workspaceId) ? selectedWorkspaceRole : availableWorkspaces;

    return (
        <CasualCell
            {...rest}
            cellData={rolesWorkspacesCellData}
            tooltip={<WorkspaceRoleTooltipContent />}
            tooltipProps={{
                // Calc is needed to account for paddings
                width: 'calc(size-4600 + size-100)',
            }}
        />
    );
};
