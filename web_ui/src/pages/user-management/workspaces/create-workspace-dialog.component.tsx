// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ComponentProps, FormEvent, useState } from 'react';

import { useWorkspacesApi } from '@geti/core/src/workspaces/hooks/use-workspaces.hook';
import {
    Button,
    ButtonGroup,
    Content,
    Dialog,
    DialogContainer,
    Divider,
    Flex,
    Form,
    Heading,
    Text,
    TextField,
} from '@geti/ui';
import { OverlayTriggerState } from '@react-stately/overlays';
import { isEmpty } from 'lodash-es';

import { useOrganizationIdentifier } from '../../../hooks/use-organization-identifier/use-organization-identifier.hook';

interface CreateWorkspaceDialogProps {
    triggerState: OverlayTriggerState;
    names: string[];
    nameLimitations?: Partial<Pick<ComponentProps<typeof TextField>, 'maxLength' | 'minLength'>>;
}

export const CreateWorkspaceDialog = ({ names, triggerState, nameLimitations = {} }: CreateWorkspaceDialogProps) => {
    const [updatedName, setUpdatedName] = useState<string>('');

    const isEmptyName = isEmpty(updatedName);
    const isDuplicatedName = names.some((name) => name.toLocaleLowerCase() === updatedName.trim().toLocaleLowerCase());
    const isConfirmButtonDisabled = isEmptyName || isDuplicatedName;
    const { organizationId } = useOrganizationIdentifier();
    const { useCreateWorkspaceMutation } = useWorkspacesApi(organizationId);
    const createWorkspace = useCreateWorkspaceMutation();

    const handleOnChange = (name: string) => {
        setUpdatedName(name);
    };

    const handleConfirm = (event: FormEvent) => {
        event.preventDefault();
        const newName = updatedName.trim();

        createWorkspace.mutate({ name: newName });

        triggerState.close();
    };

    return (
        <DialogContainer onDismiss={triggerState.close}>
            {triggerState.isOpen && (
                <Dialog size='S'>
                    <Heading>
                        <Flex alignItems='center' gap='size-100'>
                            <Text>Create a new workspace</Text>
                        </Flex>
                    </Heading>
                    <Divider />
                    <Content>
                        <Form onSubmit={handleConfirm}>
                            <TextField
                                id={`create-workspace-name`}
                                data-testid={`create-workspace-name`}
                                width={'100%'}
                                value={updatedName}
                                onChange={handleOnChange}
                                label={'Workspace name'}
                                validationState={isDuplicatedName ? 'invalid' : undefined}
                                errorMessage={isDuplicatedName ? `Workspace name must be unique` : undefined}
                                maxLength={nameLimitations?.maxLength}
                                minLength={nameLimitations?.minLength}
                                // eslint-disable-next-line jsx-a11y/no-autofocus
                                autoFocus
                            />
                            <ButtonGroup align={'end'} marginTop={'size-325'}>
                                <Button variant='secondary' onPress={triggerState.close} id={`cancel-create-workspace`}>
                                    Cancel
                                </Button>
                                <Button
                                    variant='accent'
                                    isDisabled={isConfirmButtonDisabled}
                                    type='submit'
                                    id={`confirm-create-workspace`}
                                    data-testid={`confirm-create-workspace`}
                                >
                                    Confirm
                                </Button>
                            </ButtonGroup>
                        </Form>
                    </Content>
                </Dialog>
            )}
        </DialogContainer>
    );
};
