// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode } from 'react';

import { AlertDialog, DialogContainer } from '@geti/ui';
import { OverlayTriggerState } from '@react-stately/overlays';

interface DeleteDialogProps {
    name: string;
    onAction: () => void;
    triggerState: OverlayTriggerState;
    isWorkspaceEmpty: boolean;
}

export const WorkspaceDeleteDialog = ({ triggerState, onAction, name, isWorkspaceEmpty }: DeleteDialogProps) => {
    const deleteDialog: ReactNode = (
        <AlertDialog
            title={'Delete workspace'}
            variant='destructive'
            primaryActionLabel='Delete'
            onPrimaryAction={() => {
                onAction();
                triggerState.close();
            }}
            cancelLabel={'Cancel'}
        >
            {`Are you sure you want to delete workspace "${name}"?`}
        </AlertDialog>
    );

    const warningDialog: ReactNode = (
        <AlertDialog title={'Cannot delete workspace'} variant='warning' primaryActionLabel='Ok'>
            You cannot delete a workspace that contains projects. Please remove all projects from the workspace before
            deleting it.
        </AlertDialog>
    );

    return (
        <DialogContainer onDismiss={() => triggerState.close()}>
            {isWorkspaceEmpty ? deleteDialog : warningDialog}
        </DialogContainer>
    );
};
