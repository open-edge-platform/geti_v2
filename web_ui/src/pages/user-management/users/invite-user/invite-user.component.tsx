// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FormEvent, useRef, useState } from 'react';

import { useUsers } from '@geti/core/src/users/hook/use-users.hook';
import { RESOURCE_TYPE, USER_ROLE } from '@geti/core/src/users/users.interface';
import { WorkspaceIdentifier } from '@geti/core/src/workspaces/services/workspaces.interface';
import {
    Button,
    ButtonGroup,
    Content,
    ContextualHelp,
    Dialog,
    DialogContainer,
    Divider,
    Flex,
    Form,
    Heading,
    Item,
    Picker,
    Text,
    TextField,
    TextFieldRef,
} from '@geti/ui';
import { Info } from '@geti/ui/icons';

import { useWorkspaces } from '../../../../providers/workspaces-provider/workspaces-provider.component';
import { isYupValidationError } from '../../profile-page/utils';
import { ErrorMessage } from '../add-member-popup/error-message/error-message.component';
import { RolePicker } from '../old-project-users/role-picker.component';
import { OrganizationRoleTooltipContent } from '../organization-role-tooltip/organization-role-tooltip';
import { MAX_NUMBER_OF_CHARACTERS, validateEmail, validateUserEmail } from '../utils';
import { WorkspaceRoleTooltipContent } from '../workspace-role-tooltip/workspace-role-tooltip';

import classes from '../add-member-popup/add-member-popup.module.scss';

interface InviteUserDialogProps extends WorkspaceIdentifier {
    id: string;
    isAdmin: boolean; // active user admin status used to allow selecting workspace admin role
}
export const InviteUserDialog = ({ isAdmin, id, organizationId, workspaceId }: InviteUserDialogProps) => {
    // Org role selection
    const orgRoles = isAdmin
        ? [USER_ROLE.ORGANIZATION_CONTRIBUTOR, USER_ROLE.ORGANIZATION_ADMIN]
        : [USER_ROLE.ORGANIZATION_CONTRIBUTOR];
    const [selectedOrgRole, setSelectedOrgRole] = useState<USER_ROLE>(USER_ROLE.ORGANIZATION_CONTRIBUTOR);

    // Workspace selection (only when org contributor)
    const { workspaces } = useWorkspaces();
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | undefined>(workspaceId);
    const workspaceRoles = isAdmin
        ? [USER_ROLE.WORKSPACE_CONTRIBUTOR, USER_ROLE.WORKSPACE_ADMIN]
        : [USER_ROLE.WORKSPACE_CONTRIBUTOR];
    const [selectedWorkspaceRole, setSelectedWorkspaceRole] = useState<USER_ROLE | undefined>(workspaceRoles[0]);

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string>('');

    const { useGetUsersQuery, useInviteUserMutation } = useUsers();
    const { users } = useGetUsersQuery(organizationId);
    const inviteUser = useInviteUserMutation(organizationId);

    const inputRef = useRef<TextFieldRef>(null);

    const isValidEmail = validateEmail.isValidSync(email);
    const isBtnDisabled = !isValidEmail || !email || !!errorMsg;

    const handleOpen = (): void => {
        setIsOpen(true);
    };

    const handleChange = (value: string): void => {
        try {
            setEmail(value);

            validateUserEmail(value, users ?? []).validateSync({ email: value }, { abortEarly: false });

            errorMsg && setErrorMsg('');
        } catch (error: unknown) {
            if (isYupValidationError(error)) {
                error.inner.length && setErrorMsg(error.inner[0].message);
            }
        }
    };

    const handleDismiss = (): void => {
        setIsOpen(false);
        if (email) setEmail('');
        if (errorMsg) setErrorMsg('');
        setSelectedOrgRole(USER_ROLE.ORGANIZATION_CONTRIBUTOR);
        setSelectedWorkspaceRole(workspaceRoles[0]);
        setSelectedWorkspaceId(workspaceId);
    };

    const handleSubmit = (event: FormEvent): void => {
        event.preventDefault();
        const rolesPayload: { resourceId: string; resourceType: RESOURCE_TYPE; role: USER_ROLE }[] = [];

        rolesPayload.push({
            resourceId: organizationId,
            resourceType: RESOURCE_TYPE.ORGANIZATION,
            role: selectedOrgRole,
        });

        if (selectedOrgRole === USER_ROLE.ORGANIZATION_CONTRIBUTOR && selectedWorkspaceId && selectedWorkspaceRole) {
            rolesPayload.push({
                resourceId: selectedWorkspaceId,
                resourceType: RESOURCE_TYPE.WORKSPACE,
                role: selectedWorkspaceRole,
            });
        }

        inviteUser.mutate(
            {
                organizationId,
                email: email.trim(),
                roles: rolesPayload,
            },
            { onSuccess: handleDismiss }
        );
    };

    return (
        <>
            <Button variant={'accent'} onPress={handleOpen} id={id}>
                Send invite
            </Button>
            <DialogContainer onDismiss={handleDismiss}>
                {isOpen && (
                    <Dialog>
                        <Heading>Send invite</Heading>
                        <Divider size={'S'} />
                        <Content UNSAFE_style={{ overflow: 'hidden' }}>
                            <Form onSubmit={handleSubmit}>
                                <TextField
                                    ref={inputRef}
                                    // eslint-disable-next-line jsx-a11y/no-autofocus
                                    autoFocus
                                    id={'email-address-id'}
                                    type={'email'}
                                    label={'Email address'}
                                    autoComplete={'email'}
                                    value={email}
                                    onChange={handleChange}
                                    maxLength={MAX_NUMBER_OF_CHARACTERS}
                                    validationState={!isValidEmail || errorMsg ? 'invalid' : undefined}
                                />
                                <RolePicker
                                    roles={orgRoles}
                                    selectedRole={selectedOrgRole}
                                    label='Organization Role'
                                    aria-label='Organization Role'
                                    testId='invite-user-organization-role-picker'
                                    setSelectedRole={(role) => {
                                        setSelectedOrgRole(role as USER_ROLE);
                                        if (role === USER_ROLE.ORGANIZATION_ADMIN) {
                                            setSelectedWorkspaceId(undefined);
                                            setSelectedWorkspaceRole(undefined);
                                        } else {
                                            if (!selectedWorkspaceId && workspaces.length > 0) {
                                                setSelectedWorkspaceId(workspaces[0].id);
                                            }
                                            if (!selectedWorkspaceRole) {
                                                setSelectedWorkspaceRole(workspaceRoles[0]);
                                            }
                                        }
                                    }}
                                    contextualHelp={
                                        <ContextualHelp>
                                            <Heading>What roles can there be in an organization?</Heading>
                                            <Content UNSAFE_className={classes.organizationRoleContextualHelp}>
                                                <OrganizationRoleTooltipContent />
                                            </Content>
                                        </ContextualHelp>
                                    }
                                />
                                {selectedOrgRole === USER_ROLE.ORGANIZATION_CONTRIBUTOR ? (
                                    <Flex
                                        direction={'row'}
                                        gap={'size-400'}
                                        marginTop={'size-150'}
                                        justifyContent={'space-between'}
                                    >
                                        <Picker
                                            label={'Workspace'}
                                            selectedKey={selectedWorkspaceId}
                                            onSelectionChange={(key) => setSelectedWorkspaceId(key as string)}
                                            items={workspaces}
                                            aria-label={'Workspace'}
                                            width={'100%'}
                                        >
                                            {(workspace) => <Item key={workspace.id}>{workspace.name}</Item>}
                                        </Picker>
                                        <RolePicker
                                            roles={workspaceRoles}
                                            selectedRole={selectedWorkspaceRole}
                                            label='Workspace Role'
                                            setSelectedRole={(role) => setSelectedWorkspaceRole(role)}
                                            width={'100%'}
                                            contextualHelp={
                                                <ContextualHelp>
                                                    <Heading>What roles can there be in a workspace?</Heading>
                                                    <Content UNSAFE_className={classes.workspaceRoleContextualHelp}>
                                                        <WorkspaceRoleTooltipContent />
                                                    </Content>
                                                </ContextualHelp>
                                            }
                                        />
                                    </Flex>
                                ) : (
                                    <></>
                                )}
                                <ErrorMessage marginTop={'size-150'} message={errorMsg} id={'invite'} />
                                <Flex alignItems={'center'} gap={'size-100'} marginTop={'size-150'}>
                                    <Info />
                                    <Text>Note: Invitation is only valid for 7 days.</Text>
                                </Flex>
                                <ButtonGroup align={'end'} marginTop={'size-350'}>
                                    <Button variant={'secondary'} onPress={handleDismiss} id={'cancel-btn-id'}>
                                        Cancel
                                    </Button>
                                    <Button
                                        isPending={inviteUser.isPending}
                                        isDisabled={
                                            isBtnDisabled ||
                                            (selectedOrgRole === USER_ROLE.ORGANIZATION_CONTRIBUTOR &&
                                                (!selectedWorkspaceId || !selectedWorkspaceRole))
                                        }
                                        id={'send-btn-id'}
                                        type={'submit'}
                                        aria-label={'send invitation'}
                                    >
                                        Send
                                    </Button>
                                </ButtonGroup>
                            </Form>
                        </Content>
                    </Dialog>
                )}
            </DialogContainer>
        </>
    );
};
