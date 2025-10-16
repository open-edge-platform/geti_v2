// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Flex, Text, View } from '@geti/ui';

export const WorkspaceRoleTooltipContent = () => (
    <View width={'size-4600'}>
        <Flex direction={'column'} gap={'size-100'}>
            <Text>
                <strong>Workspace admin:</strong> has full create, view, access, and edit rights for projects inside the
                workspace that they have access to. Workspace admins can add users from the organization to their
                workspace and to projects. Workspace admins can assign other users inside their workspace as org admin
                as well, with the same permissions. Workspace admin accounts can only be removed from the workspace or
                permanently deleted if there is another workspace admin user in that same workspace.
            </Text>
            <Text marginTop={'size-150'}>
                <strong>Workspace contributor:</strong> can create projects, and view, access, and edit projects that
                they are added to. They can be project manager if they create projects themselves, and/or can be added
                to projects as project manager or project contributor. Project contributor can&apos;t add users to a
                project.
            </Text>
        </Flex>
    </View>
);
