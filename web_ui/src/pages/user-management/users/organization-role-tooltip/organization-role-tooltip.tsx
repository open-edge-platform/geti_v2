// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Flex, Text, View } from '@geti/ui';

export const OrganizationRoleTooltipContent = () => (
    <View width={'size-4600'}>
        <Flex direction={'column'} gap={'size-100'}>
            <Text>
                New users that are added to an organization can have two different roles: organization admin and
                organization contributor.
            </Text>
            <Text>
                An <strong>organization admin</strong> has full visibility, access, and editing rights. They can create
                and manage all workspaces, as well as all projects created by anyone in the organization. Additionally,
                organization admins are the only users who can add new members to the organization. An organization
                admin account can only be deleted if another organization admin is present.
            </Text>
            <Text>
                An <strong>organization contributor</strong> cannot create workspaces or add new users to the
                organization. View, access, and edit rights depend on their workspace role: they can be either a
                workspace admin or a workspace contributor.
            </Text>
        </Flex>
    </View>
);
