// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FormEvent, useState } from 'react';

import QUERY_KEYS from '@geti/core/src/requests/query-keys';
import { useUsers } from '@geti/core/src/users/hook/use-users.hook';
import { getRoleDTO } from '@geti/core/src/users/services/utils';
import { RESOURCE_TYPE, USER_ROLE, UserCreationDTO } from '@geti/core/src/users/users.interface';
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
    PasswordField,
    Picker,
    TextField,
} from '@geti/ui';
import { useQueryClient } from '@tanstack/react-query';
import { ValidationError } from 'yup';

import { useWorkspaces } from '../../../../providers/workspaces-provider/workspaces-provider.component';
import { CONFIRM_PASSWORD_ERROR_MESSAGE, encodeToBase64 } from '../../../../shared/utils';
import { EditFullName } from '../../profile-page/edit-full-name.component';
import { isYupValidationError } from '../../profile-page/utils';
import { RolePicker } from '../old-project-users/role-picker.component';
import { OrganizationRoleTooltipContent } from '../organization-role-tooltip/organization-role-tooltip';
import { MAX_NUMBER_OF_CHARACTERS, validateEmail, validateUserEmail } from '../utils';
import { WorkspaceRoleTooltipContent } from '../workspace-role-tooltip/workspace-role-tooltip';
import { PasswordState } from './add-member-popup.interface';
import { ErrorMessage } from './error-message/error-message.component';
import { defaultPasswordState, handlePassword, validatePasswordsSchema } from './utils';

import classes from './add-member-popup.module.scss';

type AddMemberPopupProps = WorkspaceIdentifier;

export const AddMemberPopup = ({ organizationId, workspaceId }: AddMemberPopupProps) => {
    const roles = [USER_ROLE.WORKSPACE_CONTRIBUTOR, USER_ROLE.WORKSPACE_ADMIN]; // workspace roles
    const orgRoles: USER_ROLE[] = [USER_ROLE.ORGANIZATION_CONTRIBUTOR, USER_ROLE.ORGANIZATION_ADMIN];

    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const [selectedOrgRole, setSelectedOrgRole] = useState<USER_ROLE>(USER_ROLE.ORGANIZATION_CONTRIBUTOR);
    const [selectedWorkspaceRole, setSelectedWorkspaceRole] = useState<USER_ROLE | undefined>(roles[0]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(workspaceId);
    const [email, setEmail] = useState<string>('');
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [password, setPassword] = useState<PasswordState>(defaultPasswordState);
    const [confirmPassword, setConfirmPassword] = useState<PasswordState>(defaultPasswordState);
    const [emailErrorMessage, setEmailErrorMessage] = useState<string>('');

    const queryClient = useQueryClient();
    const { workspaces } = useWorkspaces();
    const { useGetUsersQuery, useCreateUser } = useUsers();
    const { users } = useGetUsersQuery(organizationId);
    const createUser = useCreateUser();

    const isValidEmail = validateEmail.isValidSync(email);
    const isDisabled = Boolean(
        !email ||
            !isValidEmail ||
            !firstName ||
            !lastName ||
            (selectedOrgRole === USER_ROLE.ORGANIZATION_CONTRIBUTOR &&
                (!selectedWorkspaceRole || !selectedWorkspaceId)) ||
            !password.value ||
            !confirmPassword.value ||
            password.error ||
            confirmPassword.error ||
            emailErrorMessage
    );

    const handleEmailChange = (value: string): void => {
        try {
            setEmail(value);

            validateUserEmail(value, users ?? []).validateSync({ email: value }, { abortEarly: false });

            emailErrorMessage && setEmailErrorMessage('');
        } catch (error: unknown) {
            if (isYupValidationError(error)) {
                error.inner.length && setEmailErrorMessage(error.inner[0].message);
            }
        }
    };

    const handleOnDismiss = (): void => {
        setIsDialogOpen(false);
        setEmail('');
        setFirstName('');
        setLastName('');
        setSelectedOrgRole(USER_ROLE.ORGANIZATION_CONTRIBUTOR);
        setSelectedWorkspaceRole(undefined);
        setSelectedWorkspaceId(workspaceId);
        setPassword(defaultPasswordState);
        setConfirmPassword(defaultPasswordState);
        setEmailErrorMessage('');
    };

    const handleOnSubmit = async (event: FormEvent): Promise<void> => {
        event.preventDefault();

        try {
            const result = validatePasswordsSchema.validateSync(
                {
                    password: password.value,
                    confirmPassword: confirmPassword.value,
                },
                { abortEarly: false }
            );

            const createdUser: UserCreationDTO = {
                email,
                firstName: firstName.trim(),
                secondName: lastName.trim(),
                password: encodeToBase64(result.password),
                roles: (() => {
                    const base = [
                        getRoleDTO({
                            resourceId: organizationId,
                            resourceType: RESOURCE_TYPE.ORGANIZATION,
                            role: selectedOrgRole,
                        }),
                    ];
                    if (selectedOrgRole === USER_ROLE.ORGANIZATION_CONTRIBUTOR && selectedWorkspaceRole !== undefined) {
                        base.push(
                            getRoleDTO({
                                role: selectedWorkspaceRole,
                                resourceId: selectedWorkspaceId,
                                resourceType: RESOURCE_TYPE.WORKSPACE,
                            })
                        );
                    }
                    return base;
                })(),
            };

            createUser.mutate(
                { user: createdUser, organizationId },
                {
                    onSuccess: async () => {
                        handleOnDismiss();

                        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS(organizationId) });
                    },
                }
            );
        } catch (error) {
            if (isYupValidationError(error)) {
                const errorMsgs = {
                    password: new Array<string>(),
                    confirmPassword: new Array<string>(),
                };

                error.inner.forEach(({ path, message }: ValidationError) => {
                    if (path === 'password') {
                        errorMsgs.password.push(message);
                    } else if (path === 'confirmPassword') {
                        errorMsgs.confirmPassword.push(CONFIRM_PASSWORD_ERROR_MESSAGE);
                    }
                });

                if (errorMsgs.password.length) {
                    const [errorMsg] = errorMsgs.password;

                    setPassword((prev: PasswordState) => ({ ...prev, error: errorMsg }));
                }

                if (errorMsgs.confirmPassword.length) {
                    const [errorMsg] = errorMsgs.confirmPassword;

                    setConfirmPassword((prev: PasswordState) => ({
                        ...prev,
                        error: errorMsg,
                    }));
                }
            }
        }
    };

    return (
        <>
            <Button variant='primary' onPress={() => setIsDialogOpen(true)} id='add-user-button-id'>
                Add user
            </Button>
            <DialogContainer onDismiss={handleOnDismiss}>
                {isDialogOpen && (
                    <Dialog>
                        <Heading
                            UNSAFE_className={classes.addMemberTitle}
                            data-testid={'add-user-title-id'}
                            id='add-user-title'
                        >
                            Add user
                        </Heading>
                        <Divider />
                        <Content>
                            <Form onSubmit={handleOnSubmit}>
                                <TextField
                                    label='Email address'
                                    id='email-address-add-user'
                                    type='email'
                                    value={email}
                                    autoComplete={'off'}
                                    // eslint-disable-next-line jsx-a11y/no-autofocus
                                    autoFocus
                                    onChange={handleEmailChange}
                                    maxLength={MAX_NUMBER_OF_CHARACTERS}
                                    validationState={!isValidEmail || emailErrorMessage ? 'invalid' : undefined}
                                />
                                <ErrorMessage message={emailErrorMessage} id={'email'} />
                                <EditFullName
                                    firstName={firstName}
                                    setFirstName={setFirstName}
                                    lastName={lastName}
                                    setLastName={setLastName}
                                    flex={1}
                                />
                                <RolePicker
                                    roles={orgRoles}
                                    selectedRole={selectedOrgRole as USER_ROLE}
                                    label='Organization Role'
                                    setSelectedRole={(role) => {
                                        setSelectedOrgRole(role as USER_ROLE);
                                        if (role === USER_ROLE.ORGANIZATION_ADMIN) {
                                            setSelectedWorkspaceRole(undefined);
                                        } else if (selectedWorkspaceRole === undefined) {
                                            setSelectedWorkspaceRole(roles[0]);
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
                                            items={workspaces}
                                            aria-label={'Workspace'}
                                            width={'100%'}
                                            onSelectionChange={(key) => setSelectedWorkspaceId(key as string)}
                                        >
                                            {(workspace) => <Item key={workspace.id}>{workspace.name}</Item>}
                                        </Picker>
                                        <RolePicker
                                            label={'Workspace Role'}
                                            contextualHelp={
                                                <ContextualHelp>
                                                    <Heading>What roles can there be in a workspace?</Heading>
                                                    <Content UNSAFE_className={classes.workspaceRoleContextualHelp}>
                                                        <WorkspaceRoleTooltipContent />
                                                    </Content>
                                                </ContextualHelp>
                                            }
                                            roles={roles}
                                            selectedRole={(selectedWorkspaceRole || roles[0]) as USER_ROLE}
                                            setSelectedRole={setSelectedWorkspaceRole}
                                            width={'100%'}
                                        />
                                    </Flex>
                                ) : (
                                    <></>
                                )}
                                <PasswordField
                                    error={password.error}
                                    label='Password'
                                    isNewPassword
                                    id='password-add-user'
                                    autoComplete='off'
                                    value={password.value}
                                    onChange={handlePassword(setPassword)}
                                />
                                <PasswordField
                                    error={confirmPassword.error}
                                    label='Confirm password'
                                    id='confirm-password-add-user'
                                    autoComplete='off'
                                    value={confirmPassword.value}
                                    onChange={handlePassword(setConfirmPassword)}
                                />
                                <ButtonGroup align={'end'} marginTop={'size-350'}>
                                    <Button variant='secondary' onPress={handleOnDismiss} id='cancel-add-user'>
                                        Cancel
                                    </Button>
                                    <Button
                                        isPending={createUser.isPending}
                                        variant='accent'
                                        type={'submit'}
                                        id='save-add-user'
                                        isDisabled={isDisabled}
                                        aria-label='save add user'
                                    >
                                        Add
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
