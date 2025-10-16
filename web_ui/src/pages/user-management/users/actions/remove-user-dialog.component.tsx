// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import QUERY_KEYS from '@geti/core/src/requests/query-keys';
import { useUsers } from '@geti/core/src/users/hook/use-users.hook';
import { User } from '@geti/core/src/users/users.interface';
import { AlertDialog, Flex, Text } from '@geti/ui';
import { useQueryClient } from '@tanstack/react-query';
import { isFunction } from 'lodash-es';

import { useHandleSignOut } from '../../../../hooks/use-handle-sign-out/use-handle-sign-out.hook';

interface UserActionsProps {
    organizationId: string;
    user: User;
    activeUser: User | undefined;
    onDeleting?: () => void;
}
export const RemoveUserDialog = ({ organizationId, user, activeUser, onDeleting }: UserActionsProps) => {
    const handleSignOut = useHandleSignOut();
    const { useDeleteUser } = useUsers();
    const deleteUser = useDeleteUser();

    const queryClient = useQueryClient();
    const deleteUserAction = async () => {
        // mutation `onSuccess` wasn't called always even when the endpoint return (200 OK)
        // This is a quick fix and requires more investigation
        // https://stackoverflow.com/questions/70217129/react-query-usemutation-is-putting-my-api-call-state-in-idle
        try {
            isFunction(onDeleting) && onDeleting();

            await deleteUser.mutateAsync({ organizationId, user });
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS(organizationId) });

            if (activeUser?.id === user.id) {
                handleSignOut();
            }
        } catch (_error: unknown) {}
    };

    const email = user.email;

    return (
        <AlertDialog
            title='Delete'
            variant='destructive'
            primaryActionLabel='Delete'
            onPrimaryAction={deleteUserAction}
            cancelLabel={'Cancel'}
        >
            <Flex direction={'column'} gap={'size-150'}>
                <Text>
                    This user account of {email} will be permanently deleted from your Geti™ organization. After
                    deleting the account, the user will not be able to log in again with this account.
                </Text>
                <Text>Are you sure you want to delete {email}?</Text>
            </Flex>
        </AlertDialog>
    );
};
