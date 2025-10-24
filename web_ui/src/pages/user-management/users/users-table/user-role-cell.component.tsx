// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { RESOURCE_TYPE, Role } from '@geti/core/src/users/users.interface';

import { CasualCell } from '../../../../shared/components/table/components/casual-cell/casual-cell.component';
import { TableCellProps } from '../../../../shared/components/table/table.interface';
import { OrganizationRoleTooltipContent } from '../../../../shared/components/tooltips/organization-role-tooltip';
import { WorkspaceRoleTooltipContent } from '../../../../shared/components/tooltips/workspace-role-tooltip';
import { ProjectRoleCell } from './project-role-cell.component';

interface UserRoleCellProps extends TableCellProps {
    resourceId: string | undefined;
    isProjectUsersTable?: boolean;
}

export const UserRoleCell = ({
    resourceId,
    isProjectUsersTable = false,
    rowData,
    cellData: _unused,
    ...rest
}: UserRoleCellProps) => {
    const roles = (rowData.roles as Role[]) ?? [];

    if (isProjectUsersTable && resourceId) {
        return <ProjectRoleCell {...rest} rowData={rowData} roles={roles} projectId={resourceId} />;
    }

    if (!resourceId) {
        const organizationRole = roles.find((role) => role.resourceType === RESOURCE_TYPE.ORGANIZATION)?.role ?? 'N/A';

        return (
            <CasualCell
                {...rest}
                rowData={rowData}
                cellData={organizationRole}
                tooltip={<OrganizationRoleTooltipContent />}
                tooltipProps={{
                    width: 'calc(size-4600 + size-100)',
                }}
            />
        );
    }

    const userRole = roles.find((role) => role.resourceId === resourceId)?.role ?? 'N/A';

    return (
        <CasualCell
            {...rest}
            rowData={rowData}
            cellData={userRole}
            tooltip={<WorkspaceRoleTooltipContent />}
            tooltipProps={{
                width: 'calc(size-4600 + size-100)',
            }}
        />
    );
};
