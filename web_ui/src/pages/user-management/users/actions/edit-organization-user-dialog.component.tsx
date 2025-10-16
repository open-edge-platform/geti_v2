// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FormEvent, useMemo, useState } from 'react';

import { useUsers } from '@geti/core/src/users/hook/use-users.hook';
import { isOrganizationAdmin } from '@geti/core/src/users/user-role-utils';
import { RESOURCE_TYPE, User, USER_ROLE } from '@geti/core/src/users/users.interface';
import {
    Button,
    ButtonGroup,
    Content,
    ContextualHelp,
    Dialog,
    Divider,
    Flex,
    Form,
    Heading,
    TextField,
} from '@geti/ui';
import { Email } from '@geti/ui/icons';

import { StatusCell } from '../../../../shared/components/table/status-cell/status-cell.component';
import { OrganizationRoleTooltipContent } from '../../../../shared/components/tooltips/organization-role-tooltip';
import { RolePicker } from '../old-project-users/role-picker.component';
import { LastLoginCell } from '../users-table/last-login-cell.component';

import tooltipClasses from '../../../../shared/components/tooltips/tooltips.module.scss';
import classes from '../workspace-users/actions/user-summary.module.scss';

interface EditOrganizationUserDialogProps {
    organizationId: string;
    user: User;
    users: User[];
    activeUser: User;
    isSaasEnvironment: boolean;
    closeDialog: () => void;
}

export const EditOrganizationUserDialog = ({
    organizationId,
    user,
    users,
    activeUser,
    isSaasEnvironment,
    closeDialog,
}: EditOrganizationUserDialogProps) => {
    const { useUpdateUser, useUpdateRole } = useUsers();
    const updateUser = useUpdateUser();
    const updateRole = useUpdateRole();

    const isActiveOrgAdmin = isOrganizationAdmin(activeUser, organizationId);
    const isEditingSelf = activeUser.id === user.id;

    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName, setLastName] = useState(user.lastName);

    const currentOrgRole: USER_ROLE | undefined = useMemo(
        () =>
            user.roles.find(
                (role) => role.resourceType === RESOURCE_TYPE.ORGANIZATION && role.resourceId === organizationId
            )?.role,
        [user.roles, organizationId]
    );

    const [selectedOrgRole, setSelectedOrgRole] = useState<USER_ROLE | undefined>(currentOrgRole);

    const orgAdmins = useMemo(
        () =>
            users.filter((_user) =>
                _user.roles.some(
                    (role) =>
                        role.resourceType === RESOURCE_TYPE.ORGANIZATION &&
                        role.resourceId === organizationId &&
                        role.role === USER_ROLE.ORGANIZATION_ADMIN
                )
            ),
        [users, organizationId]
    );
    const isLastRemainingOrgAdmin = currentOrgRole === USER_ROLE.ORGANIZATION_ADMIN && orgAdmins.length === 1;

    const canEditNames = isActiveOrgAdmin || isEditingSelf;

    const nameChanged = firstName !== user.firstName || lastName !== user.lastName;
    const roleChanged = selectedOrgRole !== currentOrgRole;

    const isSaveDisabled = !nameChanged && !roleChanged;

    const canUpdateUser = nameChanged && !isSaasEnvironment && canEditNames;
    const canUpdateUserRoles =
        roleChanged &&
        isActiveOrgAdmin &&
        selectedOrgRole &&
        !(isLastRemainingOrgAdmin && selectedOrgRole !== USER_ROLE.ORGANIZATION_ADMIN);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (canUpdateUser) {
            updateUser.mutate({
                user: { ...user, firstName, lastName },
                userId: user.id,
                organizationId,
            });
        }

        if (canUpdateUserRoles) {
            updateRole.mutate({
                organizationId,
                userId: user.id,
                resourceId: organizationId,
                resourceType: RESOURCE_TYPE.ORGANIZATION,
                newRole: selectedOrgRole,
                previousRole: currentOrgRole,
            });
        }

        closeDialog();
    };

    return (
        <Dialog isDismissable>
            <Heading id='edit-org-user-title'>Edit user</Heading>
            <Divider />
            <Content>
                <Flex
                    alignItems='start'
                    justifyContent='space-between'
                    UNSAFE_className={classes.editMemberUserInfo}
                    marginTop='size-160'
                    marginBottom='size-115'
                >
                    <Flex minWidth={0} alignItems='center' gap='size-130' UNSAFE_className={classes.editMemberEmail}>
                        <Email id='email-icon' />
                        <span
                            id='user-email'
                            data-testid={'user-email'}
                            title={user.email}
                            className={classes.editMemberEmail}
                        >
                            {user.email}
                        </span>
                    </Flex>

                    <Flex direction={'column'} alignItems={'end'}>
                        <StatusCell id={`user-status-${user.firstName}-${user.lastName}`} status={user.status} />
                        <Flex
                            gap={'size-50'}
                            UNSAFE_className={classes.lastLogin}
                            data-testid={`last-successful-login-${user.firstName}-${user.lastName}`}
                        >
                            Last login:
                            <LastLoginCell
                                id={`last-successful-login-${user.firstName}-${user.lastName}`}
                                lastSuccessfulLogin={user.lastSuccessfulLogin}
                                direction='row'
                            />
                        </Flex>
                    </Flex>
                </Flex>
                <Form onSubmit={handleSubmit}>
                    <Flex gap={'size-200'} marginBottom={'size-200'}>
                        <TextField
                            label='First name'
                            id='org-edit-first-name'
                            width={'100%'}
                            isDisabled={!canEditNames || isSaasEnvironment}
                            value={firstName}
                            onChange={setFirstName}
                        />
                        <TextField
                            label='Last name'
                            id='org-edit-last-name'
                            width={'100%'}
                            isDisabled={!canEditNames || isSaasEnvironment}
                            value={lastName}
                            onChange={setLastName}
                        />
                    </Flex>
                    <RolePicker
                        label='Organization role'
                        roles={[USER_ROLE.ORGANIZATION_ADMIN, USER_ROLE.ORGANIZATION_CONTRIBUTOR]}
                        selectedRole={selectedOrgRole as USER_ROLE}
                        setSelectedRole={setSelectedOrgRole}
                        isDisabled={isLastRemainingOrgAdmin}
                        contextualHelp={
                            <ContextualHelp>
                                <Heading>What roles can there be in an organization?</Heading>
                                <Content UNSAFE_className={tooltipClasses.organizationRoleContextualHelp}>
                                    <OrganizationRoleTooltipContent />
                                </Content>
                            </ContextualHelp>
                        }
                    />
                    <ButtonGroup align={'end'} marginTop={'size-350'}>
                        <Button variant='secondary' onPress={closeDialog} id='cancel-edit-org-user'>
                            Cancel
                        </Button>
                        <Button
                            id='save-edit-org-user'
                            variant='accent'
                            type={'submit'}
                            isDisabled={isSaveDisabled}
                            isPending={updateUser.isPending || updateRole.isPending}
                        >
                            Save
                        </Button>
                    </ButtonGroup>
                </Form>
            </Content>
        </Dialog>
    );
};
