// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC, FormEvent, useState } from 'react';

import { useFeatureFlags } from '@geti/core/src/feature-flags/hooks/use-feature-flags.hook';
import { useUsers } from '@geti/core/src/users/hook/use-users.hook';
import { getRoleCreationPayload, getRoleDeletionPayload } from '@geti/core/src/users/services/utils';
import { isOrganizationAdmin } from '@geti/core/src/users/user-role-utils';
import {
    RESOURCE_TYPE,
    RoleResource,
    UpdateRolePayload,
    User,
    USER_ROLE,
    WorkspaceRole,
} from '@geti/core/src/users/users.interface';
import { WorkspaceEntity, WorkspaceIdentifier } from '@geti/core/src/workspaces/services/workspaces.interface';
import { Button, ButtonGroup, Content, Dialog, Divider, Flex, Form, Heading, TextField } from '@geti/ui';
import { isEmpty, isEqual } from 'lodash-es';

import { useWorkspaces } from '../../../../../providers/workspaces-provider/workspaces-provider.component';
import { RolePicker } from '../../old-project-users/role-picker.component';
import { getAvailableRoles } from './roles-validation';
import { UserSummary } from './user-summary.component';
import { mapRolesToWorkspaceRoles } from './workspace-roles/utils';
import { WorkspaceRolesContainer } from './workspace-roles/workspace-roles-container.component';

import classes from './edit-user-dialog.module.scss';

interface EditUserDialogProps extends Omit<WorkspaceIdentifier, 'workspaceId'> {
    user: User;
    activeUser: User;
    users: User[];
    isSaasEnvironment: boolean;
    closeDialog: () => void;
    workspaceId?: WorkspaceIdentifier['workspaceId'];
}

const MAP_WORKSPACE_ROLE_TO_ORGANIZATION_ROLE: Record<
    USER_ROLE.WORKSPACE_CONTRIBUTOR | USER_ROLE.WORKSPACE_ADMIN,
    USER_ROLE.ORGANIZATION_CONTRIBUTOR | USER_ROLE.ORGANIZATION_ADMIN
> = {
    [USER_ROLE.WORKSPACE_CONTRIBUTOR]: USER_ROLE.ORGANIZATION_CONTRIBUTOR,
    [USER_ROLE.WORKSPACE_ADMIN]: USER_ROLE.ORGANIZATION_ADMIN,
} as const;

const RolesSelection: FC<{
    rolesOptions: WorkspaceRole['role'][];
    workspaceRoles: WorkspaceRole[];
    onChangeRoleHandler: (role: WorkspaceRole['role']) => void;
    onChangeWorkspaceRoles: (roles: WorkspaceRole[]) => void;
    workspaces: WorkspaceEntity[];
    isOrgAdmin: boolean;
    editableWorkspaceIds: string[];
}> = ({
    rolesOptions,
    workspaceRoles,
    onChangeRoleHandler,
    onChangeWorkspaceRoles,
    workspaces,
    isOrgAdmin,
    editableWorkspaceIds,
}) => {
    const { FEATURE_FLAG_WORKSPACE_ACTIONS } = useFeatureFlags();
    const shouldUseSimpleRolesPicker = !FEATURE_FLAG_WORKSPACE_ACTIONS && workspaces.length === 1;

    if (isEmpty(rolesOptions) && shouldUseSimpleRolesPicker) {
        return null;
    }

    if (shouldUseSimpleRolesPicker) {
        const canEditSimple = isOrgAdmin || editableWorkspaceIds.includes(workspaces[0].id);
        return (
            <RolePicker
                roles={rolesOptions}
                selectedRole={workspaceRoles[0].role}
                setSelectedRole={onChangeRoleHandler}
                isDisabled={!canEditSimple}
            />
        );
    }

    return (
        <WorkspaceRolesContainer
            workspaceRoles={workspaceRoles}
            setWorkspaceRoles={onChangeWorkspaceRoles}
            workspaces={workspaces}
            isOrgAdmin={isOrgAdmin}
            editableWorkspaceIds={editableWorkspaceIds}
        />
    );
};

export const EditUserDialog = ({
    organizationId,
    workspaceId,
    user,
    activeUser,
    closeDialog,
    isSaasEnvironment,
    users,
}: EditUserDialogProps) => {
    const { workspaces } = useWorkspaces();
    const isOrgAdmin = isOrganizationAdmin(activeUser, organizationId);
    const adminWorkspaceIds = activeUser.roles
        .filter(
            ({ resourceType, role }) => resourceType === RESOURCE_TYPE.WORKSPACE && role === USER_ROLE.WORKSPACE_ADMIN
        )
        .map(({ resourceId }) => resourceId);
    const { useUpdateUser, useUpdateUserRoles, useUpdateMemberRole } = useUsers();
    const updateRoles = useUpdateUserRoles();
    const updateUser = useUpdateUser();
    const updateMemberRole = useUpdateMemberRole();
    const { FEATURE_FLAG_MANAGE_USERS_ROLES, FEATURE_FLAG_WORKSPACE_ACTIONS } = useFeatureFlags();

    const [firstName, setFirstName] = useState<string>(user.firstName);
    const [lastName, setLastName] = useState<string>(user.lastName);
    const [workspaceRoles, setWorkspaceRoles] = useState<WorkspaceRole[]>(() =>
        mapRolesToWorkspaceRoles(user.roles, workspaces)
    );

    const isAccountOwner = activeUser.id === user.id;
    const rolesOptions = !!workspaceId
        ? getAvailableRoles({
              activeMember: activeUser,
              members: users,
              workspaceId,
              isAccountOwner,
          })
        : [];

    const areRolesEqual = isEqual(workspaceRoles, mapRolesToWorkspaceRoles(user.roles, workspaces));
    const isSaveButtonDisabled = isSaasEnvironment
        ? areRolesEqual
        : areRolesEqual && user.firstName === firstName && user.lastName === lastName;

    const changeRoleHandler = (role: WorkspaceRole['role']) => {
        setWorkspaceRoles([
            {
                role,
                workspace: workspaces[0],
            },
        ]);
    };

    const updateUserName = async () => {
        const editedUser: User = {
            ...user,
            firstName,
            lastName,
            roles: workspaceRoles.map((role) => ({
                role: role.role,
                resourceId: role.workspace.id,
                resourceType: RESOURCE_TYPE.WORKSPACE,
            })),
        };

        await updateUser.mutateAsync({
            user: editedUser,
            userId: user.id,
            organizationId,
        });
    };

    const updateUserRoles = async () => {
        const editableIds = isOrgAdmin
            ? workspaces.map((w) => w.id)
            : activeUser.roles
                  .filter(({ resourceType, role }) =>
                      resourceType === RESOURCE_TYPE.WORKSPACE ? role === USER_ROLE.WORKSPACE_ADMIN : false
                  )
                  .map(({ resourceId }) => resourceId);

        const editedRoles: RoleResource[] = workspaceRoles
            .filter((wr) => editableIds.includes(wr.workspace.id))
            .map((role) => ({
                role: role.role,
                resourceId: role.workspace.id,
                resourceType: RESOURCE_TYPE.WORKSPACE,
            }));

        const oldRoles: UpdateRolePayload[] = user.roles
            .filter(
                ({ resourceType, resourceId }) =>
                    resourceType === RESOURCE_TYPE.WORKSPACE && editableIds.includes(resourceId)
            )
            .map((role) => getRoleDeletionPayload(role));
        const roles: UpdateRolePayload[] = editedRoles.map((role) => getRoleCreationPayload(role));

        if (oldRoles.length === 0 && roles.length === 0) return;

        return updateRoles.mutateAsync({ newRoles: [...oldRoles, ...roles], userId: user.id, organizationId });
    };

    const handleEditUser = async () => {
        const updateRolesPromise = updateUserRoles();

        if (isSaasEnvironment) {
            await updateRolesPromise;
        } else {
            const updateUserPromise = updateUserName();
            await Promise.all([updateRolesPromise, updateUserPromise]);
        }
    };

    const updateMemberName = async () => {
        const editedUser: User = {
            ...user,
            firstName,
            lastName,
            roles: workspaceRoles.map((role) => ({
                role: MAP_WORKSPACE_ROLE_TO_ORGANIZATION_ROLE[role.role],
                resourceId: organizationId,
                resourceType: RESOURCE_TYPE.ORGANIZATION,
            })),
        };

        await updateUser.mutateAsync({
            user: editedUser,
            userId: user.id,
            organizationId,
        });
    };

    const updateMemberRolesPromises = () => {
        return workspaceRoles.map((workspaceRole) =>
            updateMemberRole.mutateAsync({
                organizationId,
                memberId: user.id,
                role: {
                    role: MAP_WORKSPACE_ROLE_TO_ORGANIZATION_ROLE[workspaceRole.role],
                    resourceId: organizationId,
                },
            })
        );
    };

    const handleEditMember = async () => {
        if (isSaasEnvironment && !areRolesEqual) {
            if (!FEATURE_FLAG_WORKSPACE_ACTIONS) {
                await Promise.all(updateMemberRolesPromises());
            } else {
                await updateUserRoles();
            }
            return;
        }

        const editMemberPromises: Promise<void>[] = [];

        if (!areRolesEqual) {
            if (!FEATURE_FLAG_WORKSPACE_ACTIONS) {
                editMemberPromises.push(...updateMemberRolesPromises());
            } else {
                editMemberPromises.push(updateUserRoles());
            }
        }

        if (user.firstName !== firstName || user.lastName !== lastName) {
            editMemberPromises.push(updateMemberName());
        }

        await Promise.all(editMemberPromises);
    };

    const handleOnSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (FEATURE_FLAG_MANAGE_USERS_ROLES) {
            await handleEditMember();
        } else {
            await handleEditUser();
        }

        closeDialog();
    };

    return (
        <Dialog minHeight='size-3600' isDismissable>
            <Heading id='edit-user-title' UNSAFE_className={classes.editUserTitle}>
                Edit user
            </Heading>
            <Divider />
            <Content>
                <UserSummary user={user} />
                <Form onSubmit={handleOnSubmit}>
                    {/* 48px = gap + size of delete button */}
                    <Flex gap={'size-200'} alignItems={'end'} UNSAFE_style={{ width: 'calc(100% - 48px' }}>
                        <TextField
                            label='First name'
                            id='edit-first-name'
                            width={'100%'}
                            isDisabled={(!isOrgAdmin && activeUser.id !== user.id) || isSaasEnvironment}
                            value={firstName}
                            onChange={setFirstName}
                        />
                        <TextField
                            label='Last name'
                            id='edit-last-name'
                            width={'100%'}
                            isDisabled={(!isOrgAdmin && activeUser.id !== user.id) || isSaasEnvironment}
                            value={lastName}
                            onChange={setLastName}
                        />
                    </Flex>
                    <RolesSelection
                        rolesOptions={rolesOptions}
                        onChangeRoleHandler={changeRoleHandler}
                        onChangeWorkspaceRoles={setWorkspaceRoles}
                        workspaces={workspaces}
                        workspaceRoles={workspaceRoles}
                        isOrgAdmin={isOrgAdmin}
                        editableWorkspaceIds={adminWorkspaceIds}
                    />
                    <ButtonGroup align={'end'} marginTop={'size-350'}>
                        <Button variant='secondary' onPress={closeDialog} id={'cancel-edit-user'}>
                            Cancel
                        </Button>
                        <Button
                            id={'save-edit-user'}
                            variant='accent'
                            type={'submit'}
                            isPending={isSaasEnvironment ? updateRoles.isPending : updateUser.isPending}
                            isDisabled={isSaveButtonDisabled}
                        >
                            Save
                        </Button>
                    </ButtonGroup>
                </Form>
            </Content>
        </Dialog>
    );
};
