// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useMemo } from 'react';

import { useFeatureFlags } from '@geti/core/src/feature-flags/hooks/use-feature-flags.hook';
import { useUsers } from '@geti/core/src/users/hook/use-users.hook';
import { getRoleCreationPayload } from '@geti/core/src/users/services/utils';
import { RESOURCE_TYPE, User, USER_ROLE } from '@geti/core/src/users/users.interface';
import { ActionButton, Flex, Heading, Loading, View } from '@geti/ui';
import { Add } from '@geti/ui/icons';

import { useOrganizationIdentifier } from '../../../../hooks/use-organization-identifier/use-organization-identifier.hook';
import { useWorkspaces } from '../../../../providers/workspaces-provider/workspaces-provider.component';
import { HasPermission } from '../../../../shared/components/has-permission/has-permission.component';
import { OPERATION } from '../../../../shared/components/has-permission/has-permission.interface';
import { USERS_TABLE_COLUMNS, UsersTable } from '../users-table/users-table.component';

interface AvailableWorkspaceUsersProps {
    workspaceId: string;
    activeUser: User;
}

export const AvailableWorkspaceUsers = ({ workspaceId, activeUser }: AvailableWorkspaceUsersProps) => {
    const { organizationId } = useOrganizationIdentifier();
    const { workspaces } = useWorkspaces();
    const { FEATURE_FLAG_MANAGE_USERS_ROLES } = useFeatureFlags();

    const { useGetUsersQuery, useUpdateUserRoles, useUpdateMemberRole } = useUsers();

    const {
        users: orgUsers,
        isLoading: isOrgLoading,
        isFetchingNextPage: isOrgFetchingMore,
        getNextPage: getNextOrgPage,
        totalCount: orgTotal,
        totalMatchedCount: _orgMatched,
    } = useGetUsersQuery(organizationId);

    const {
        users: wsUsers,
        isLoading: isWsLoading,
        isFetchingNextPage: isWsFetchingMore,
        getNextPage: getNextWsPage,
        totalCount: _wsTotal,
        totalMatchedCount: _wsMatched,
    } = useGetUsersQuery(organizationId, { resourceType: RESOURCE_TYPE.WORKSPACE, resourceId: workspaceId });

    const availableUsers = useMemo(() => {
        if (isWsLoading || orgUsers === undefined || wsUsers === undefined) return [] as User[];
        const wsSet = new Set(wsUsers.map((u) => u.id));
        return orgUsers.filter(
            (u) => !wsSet.has(u.id) && u.roles.every((r) => r.role !== USER_ROLE.ORGANIZATION_ADMIN)
        ); // filter out org admins and workspace members
    }, [orgUsers, wsUsers, isWsLoading]);

    const updateUserRoleMutation = useUpdateUserRoles();
    const updateMemberRoleMutation = useUpdateMemberRole();

    const isLoading = isOrgLoading || isWsLoading;
    const isFetchingNextPage = isOrgFetchingMore || isWsFetchingMore;

    const handleAddUserWithRole = (user: User, role: USER_ROLE) => {
        if (!FEATURE_FLAG_MANAGE_USERS_ROLES) {
            updateUserRoleMutation.mutate({
                organizationId,
                userId: user.id,
                newRoles: [
                    getRoleCreationPayload({
                        resourceId: workspaceId,
                        resourceType: RESOURCE_TYPE.WORKSPACE,
                        role,
                    }),
                ],
            });
            return;
        }

        updateMemberRoleMutation.mutate({
            organizationId,
            memberId: user.id,
            role: { role, resourceId: workspaceId },
        });
    };

    const AddContributorAction = ({ user }: { user: User }) => (
        <ActionButton
            aria-label={`Add ${user.email} to workspace`}
            onPress={() => handleAddUserWithRole(user, USER_ROLE.WORKSPACE_CONTRIBUTOR)}
            id={`${user.id}-add-to-workspace`}
        >
            {updateUserRoleMutation.isPending || updateMemberRoleMutation.isPending ? (
                <Loading mode={'inline'} size={'S'} />
            ) : (
                <Add />
            )}
        </ActionButton>
    );

    if (availableUsers.length === 0) {
        return <></>;
    }

    return (
        <HasPermission
            operations={[OPERATION.ADD_USER_TO_WORKSPACE]}
            resources={[{ type: RESOURCE_TYPE.WORKSPACE, id: workspaceId }]}
        >
            <Flex direction={'column'} gap={'size-200'}>
                <Heading level={3}>Available users to add to this workspace</Heading>
                <View>
                    <UsersTable
                        tableId={'available-workspace-users-table-id'}
                        isFetchingNextPage={isFetchingNextPage}
                        isLoading={isLoading}
                        totalCount={orgTotal}
                        users={availableUsers}
                        hasFilters={false}
                        activeUser={activeUser}
                        getNextPage={async () => {
                            // Load more from both lists to keep difference accurate
                            await Promise.all([getNextOrgPage(), getNextWsPage()]);
                        }}
                        usersQueryParams={{}}
                        setUsersQueryParams={() => {}}
                        UserActions={({ user }) => <AddContributorAction user={user} />}
                        ignoredColumns={[
                            USERS_TABLE_COLUMNS.LAST_LOGIN,
                            USERS_TABLE_COLUMNS.REGISTRATION_STATUS,
                            USERS_TABLE_COLUMNS.ROLES,
                        ]}
                        resourceId={workspaceId}
                        workspaces={workspaces}
                        isProjectUsersTable={false}
                        organizationId={organizationId}
                    />
                </View>
            </Flex>
        </HasPermission>
    );
};
