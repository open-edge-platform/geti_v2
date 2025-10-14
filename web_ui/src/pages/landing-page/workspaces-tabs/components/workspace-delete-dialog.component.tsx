// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode } from 'react';

import { AlertDialog, DialogContainer, Loading } from '@geti/ui';
import { OverlayTriggerState } from '@react-stately/overlays';

import { useProjectActions } from '../../../../core/projects/hooks/use-project-actions.hook';
import { useOrganizationIdentifier } from '../../../../hooks/use-organization-identifier/use-organization-identifier.hook';

interface DeleteDialogProps {
    name: string;
    onAction: () => void;
    triggerState: OverlayTriggerState;
    workspaceId: string;
}

export const WorkspaceDeleteDialog = ({ triggerState, onAction, name, workspaceId }: DeleteDialogProps) => {
    const { organizationId } = useOrganizationIdentifier();
    const { useGetProjectNames } = useProjectActions();
    const projectsQuery = useGetProjectNames({ organizationId, workspaceId });
    const hasProjects = projectsQuery.data ? projectsQuery.data.projects.length > 0 : undefined;
    const loading = projectsQuery.isLoading;
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
            <p>
                This workspace will be deleted from your Geti™ organization, including access of the user accounts.
                Before deleting the workspace, please make sure that the associated users are added to another workspace
                so that they can still access your Geti™ organization.
            </p>
            <p>Are you sure you want to delete workspace {name}?</p>
        </AlertDialog>
    );

    const warningDialog: ReactNode = (
        <AlertDialog title={'Cannot delete workspace'} variant='warning' primaryActionLabel='Ok'>
            You cannot delete a workspace that contains projects. Please remove all projects from the workspace before
            deleting it.
        </AlertDialog>
    );

    const loadingDialog: ReactNode = (
        <AlertDialog title={'Checking projects'} primaryActionLabel='Cancel' onPrimaryAction={triggerState.close}>
            <Loading size={'S'} /> Checking projects in workspace...
        </AlertDialog>
    );

    return (
        <DialogContainer onDismiss={() => triggerState.close()}>
            {loading ? loadingDialog : hasProjects ? warningDialog : deleteDialog}
        </DialogContainer>
    );
};
