// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ComponentProps, useState } from 'react';

import { useProductInfo } from '@geti/core/src/platform-utils/hooks/use-platform-utils.hook';
import { useUsers } from '@geti/core/src/users/hook/use-users.hook';
import { RESOURCE_TYPE, User, UsersQueryParams } from '@geti/core/src/users/users.interface';
import { Flex } from '@geti/ui';
import { motion } from 'framer-motion';
import { isEmpty } from 'lodash-es';

import { useIsSaasEnv } from '../../../hooks/use-is-saas-env/use-is-saas-env.hook';
import { useOrganizationIdentifier } from '../../../hooks/use-organization-identifier/use-organization-identifier.hook';
import { useFirstWorkspaceIdentifier } from '../../../providers/workspaces-provider/use-first-workspace-identifier.hook';
import { useWorkspaces } from '../../../providers/workspaces-provider/workspaces-provider.component';
import { ANIMATION_PARAMETERS } from '../../../shared/animation-parameters/animation-parameters';
import { HasPermission } from '../../../shared/components/has-permission/has-permission.component';
import { OPERATION } from '../../../shared/components/has-permission/has-permission.interface';
import { AddMemberPopup } from './add-member-popup/add-member-popup.component';
import { InviteUserDialog } from './invite-user/invite-user.component';
import { UsersHeader } from './users-header.component';
import { UsersTable } from './users-table/users-table.component';
import { AvailableWorkspaceUsers } from './workspace-users/available-workspace-users.component';

interface UsersProps {
    activeUser: User;
    resourceType: RESOURCE_TYPE | RESOURCE_TYPE[] | undefined;
    resourceId: string | undefined;
    UserActions?: ComponentProps<typeof UsersTable>['UserActions'];
    ignoredColumns?: ComponentProps<typeof UsersTable>['ignoredColumns'];
    isProjectUsersTable?: ComponentProps<typeof UsersTable>['isProjectUsersTable'];
}

const USERS_LIMIT = 20;

export const Users = ({
    resourceType,
    resourceId,
    activeUser,
    UserActions = () => <></>,
    ignoredColumns = [],
    isProjectUsersTable = false,
}: UsersProps) => {
    const { organizationId } = useOrganizationIdentifier();
    const { workspaceId: firstWorkspaceId } = useFirstWorkspaceIdentifier();
    const isSaasEnvironment = useIsSaasEnv();
    const { data: productInfo } = useProductInfo();
    const { workspaces } = useWorkspaces();
    const [usersQueryParams, setUsersQueryParams] = useState<UsersQueryParams>({
        sortBy: undefined,
        sortDirection: undefined,
    });
    const { useGetUsersQuery } = useUsers();
    const { users, totalCount, totalMatchedCount, isLoading, getNextPage, isFetchingNextPage } = useGetUsersQuery(
        organizationId,
        {
            ...usersQueryParams,
            limit: USERS_LIMIT,
            resourceId,
            resourceType,
        }
    );

    const { sortBy, sortDirection, ...filteringParams } = usersQueryParams;
    const hasFilters = !isEmpty(filteringParams);

    const enableCreation = Array.isArray(resourceType) ? resourceType.length > 0 : resourceType === undefined;
    const shouldShowAddUserButton = enableCreation && !isSaasEnvironment && productInfo?.isSmtpDefined === false;
    const shouldShowInviteUserButton = enableCreation && (isSaasEnvironment || productInfo?.isSmtpDefined === true);

    const actionsSlot = (
        <HasPermission operations={[OPERATION.MANAGE_USER, OPERATION.INVITE_USER]}>
            <Flex gap={'size-150'} alignItems={'center'}>
                {shouldShowAddUserButton && (
                    <AddMemberPopup organizationId={organizationId} workspaceId={firstWorkspaceId} />
                )}
                {shouldShowInviteUserButton && (
                    <InviteUserDialog
                        isAdmin={activeUser.isAdmin}
                        id={'send-invite-btn-id'}
                        organizationId={organizationId}
                        workspaceId={firstWorkspaceId}
                    />
                )}
            </Flex>
        </HasPermission>
    );

    return (
        <motion.div
            variants={ANIMATION_PARAMETERS.FADE_ITEM}
            initial={'hidden'}
            animate={'visible'}
            style={{ height: '100%' }}
        >
            <Flex direction={'column'}>
                <UsersHeader
                    totalMatchedCount={totalMatchedCount}
                    totalCount={totalCount}
                    hasFilterOptions={hasFilters}
                    setUsersQueryParams={setUsersQueryParams}
                    isProjectUsersTable={isProjectUsersTable}
                    actionsSlot={actionsSlot}
                />
                <UsersTable
                    isFetchingNextPage={isFetchingNextPage}
                    isLoading={isLoading}
                    totalCount={totalCount}
                    users={users}
                    hasFilters={hasFilters}
                    activeUser={activeUser}
                    getNextPage={getNextPage}
                    usersQueryParams={usersQueryParams}
                    setUsersQueryParams={setUsersQueryParams}
                    UserActions={UserActions}
                    ignoredColumns={ignoredColumns}
                    resourceId={resourceId}
                    workspaces={workspaces}
                    isProjectUsersTable={isProjectUsersTable}
                    organizationId={organizationId}
                />
                {resourceType === RESOURCE_TYPE.WORKSPACE && resourceId !== undefined && (
                    <AvailableWorkspaceUsers workspaceId={resourceId} activeUser={activeUser} />
                )}
            </Flex>
        </motion.div>
    );
};
