// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { RESOURCE_TYPE, User } from '@geti/core/src/users/users.interface';
import { Flex, Text } from '@geti/ui';

import { OrganizationUserActions } from './actions/organization-user-actions.component';
import { Users } from './users.component';

interface UsersTabProps {
    activeUser: User | undefined;
}

export const UsersTab = ({ activeUser }: UsersTabProps) => {
    if (!activeUser) return <></>;

    return (
        <Flex direction={'column'} height={'100%'} gap={'size-200'}>
            <Text>
                View and manage the users that are part of your organization. Organization admins can view and manage
                all workspaces and projects. They can invite new users to this Geti™ environment and create additional
                workspaces to separate their teams. Organization contributors can create projects inside the workspaces
                that they have been added to.
            </Text>
            <Users
                activeUser={activeUser}
                resourceType={[RESOURCE_TYPE.ORGANIZATION, RESOURCE_TYPE.WORKSPACE]}
                resourceId={undefined}
                UserActions={OrganizationUserActions}
            />
        </Flex>
    );
};
