// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import QUERY_KEYS from '@geti/core/src/requests/query-keys';
import { useUsers } from '@geti/core/src/users/hook/use-users.hook';
import { getRoleDeletionPayload } from '@geti/core/src/users/services/utils';
import { RESOURCE_TYPE, User } from '@geti/core/src/users/users.interface';
import { AlertDialog, Flex, Text } from '@geti/ui';
import { useQueryClient } from '@tanstack/react-query';

import { useWorkspaces } from '../../../../../providers/workspaces-provider/workspaces-provider.component';

interface RemoveFromWorkspaceDialogProps {
    organizationId: string;
    workspaceId: string;
    user: User;
    onAfterRemove?: () => void;
}

export const RemoveFromWorkspaceDialog = ({
    organizationId,
    workspaceId,
    user,
    onAfterRemove,
}: RemoveFromWorkspaceDialogProps) => {
    const { useUpdateUserRoles } = useUsers();
    const updateRoles = useUpdateUserRoles();
    const queryClient = useQueryClient();
    const { workspaces } = useWorkspaces();
    const workspaceName = workspaces.find((w) => w.id === workspaceId)?.name ?? 'this workspace';

    const removeAction = async () => {
        const rolesToRemove = user.roles.filter(
            (r) => r.resourceType === RESOURCE_TYPE.WORKSPACE && r.resourceId === workspaceId
        );
        if (rolesToRemove.length === 0) return;
        const deletionPayloads = rolesToRemove.map((r) => getRoleDeletionPayload(r));
        await updateRoles.mutateAsync({ newRoles: deletionPayloads, userId: user.id, organizationId });
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS(organizationId) });
        onAfterRemove?.();
    };

    return (
        <AlertDialog
            title='Remove user account'
            variant='destructive'
            primaryActionLabel='Remove'
            onPrimaryAction={removeAction}
            cancelLabel='Cancel'
        >
            <Flex direction={'column'} gap={'size-150'}>
                <Text>
                    {user.email} will be removed from {workspaceName}. Before removing the user, please make sure that
                    the user is added to another workspace so that they can still access your Geti organization. You can
                    add the user back to this workspace at any time.
                </Text>
                <Text>
                    Are you sure you want to remove {user.email} from {workspaceName}?
                </Text>
            </Flex>
        </AlertDialog>
    );
};
