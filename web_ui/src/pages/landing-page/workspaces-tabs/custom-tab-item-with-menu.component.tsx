// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ComponentProps, Dispatch } from 'react';

import { WorkspaceEntity } from '@geti/core/src/workspaces/services/workspaces.interface';

import { useProjectActions } from '../../../core/projects/hooks/use-project-actions.hook';
import { useOrganizationIdentifier } from '../../../hooks/use-organization-identifier/use-organization-identifier.hook';
import {
    PinnedCollapsedItemsAction,
    PinnedCollapsedItemsActions,
} from '../../../hooks/use-pinned-collapsed-items/use-pinned-collapsed-items.interface';
import {
    CustomTabItem,
    CustomTabItemProps,
} from '../../../shared/components/custom-tab-item/custom-tab-item.component';
import { EditNameDialog } from '../../../shared/components/edit-name-dialog/edit-name-dialog.component';
import { MenuTriggerButton } from '../../../shared/components/menu-trigger/menu-trigger-button/menu-trigger-button.component';
import { hasDifferentId } from '../../../shared/utils';
import { MAX_LENGTH_OF_WORKSPACE_NAME, MIN_LENGTH_OF_WORKSPACE_NAME } from '../../user-management/workspaces/utils';
import { WorkspaceDeleteDialog } from './components/workspace-delete-dialog.component';
import { useWorkspaceActions } from './hooks/use-workspace-actions.hook';

import classes from '../../../shared/components/custom-tab-item/custom-tab-item.module.scss';

type CustomTabItemWithMenuProps = Pick<CustomTabItemProps, 'isMoreIconVisible'> &
    Pick<ComponentProps<typeof MenuTriggerButton>, 'ariaLabel'> & {
        workspace: WorkspaceEntity;
        workspaces: WorkspaceEntity[];
        dispatchWorkspaces: Dispatch<PinnedCollapsedItemsActions<WorkspaceEntity>>;
        selectWorkspace: (workspaceId: string) => void;
    };

export const CustomTabItemWithMenu = ({
    ariaLabel,
    isMoreIconVisible,
    workspace,
    workspaces,
    dispatchWorkspaces,
    selectWorkspace,
}: CustomTabItemWithMenuProps) => {
    const { organizationId } = useOrganizationIdentifier();
    const { useGetProjectNames } = useProjectActions();
    const projectsNamesQuery = useGetProjectNames({ organizationId, workspaceId: workspace.id });
    const isWorkspaceEmpty = projectsNamesQuery.data?.projects.length === 0;

    const { items, handleMenuAction, editDialog, deleteDialog, grayedOutKeys, disabledKeys } = useWorkspaceActions(
        workspaces.length,
        isWorkspaceEmpty,
        workspace.id
    );

    const otherWorkspacesNames = workspaces.filter(hasDifferentId(workspace.id)).map(({ name }) => name);

    const handleEditDialog = (newName: string): void => {
        editDialog.editWorkspaceMutation.mutate(
            { ...workspace, name: newName },
            {
                onSuccess: () => {
                    dispatchWorkspaces({
                        type: PinnedCollapsedItemsAction.UPDATE,
                        payload: { id: workspace.id, name: newName },
                    });

                    editDialog.editWorkspaceDialogState.close();
                },
            }
        );
    };

    const handleDeleteWorkspace = (): void => {
        deleteDialog.deleteWorkspaceMutation.mutate(
            { id: workspace.id },
            {
                onSuccess: () => {
                    const nextWorkspace = workspaces.find(({ id }) => id !== workspace.id);
                    if (nextWorkspace) {
                        selectWorkspace(nextWorkspace.id);
                    }

                    dispatchWorkspaces({
                        type: PinnedCollapsedItemsAction.REMOVE,
                        payload: { id: workspace.id },
                    });

                    deleteDialog.deleteWorkspaceDialogState.close();
                },
            }
        );
    };

    return (
        <>
            <MenuTriggerButton
                isQuiet
                id={workspace.id}
                items={items}
                onAction={handleMenuAction}
                ariaLabel={ariaLabel}
                grayedOutKeys={grayedOutKeys}
                disabledKeys={disabledKeys}
                customTriggerContent={<CustomTabItem name={workspace.name} isMoreIconVisible={isMoreIconVisible} />}
                menuTriggerClasses={classes.customTabItemMenuTrigger}
            />

            {deleteDialog.deleteWorkspaceDialogState.isOpen && (
                <WorkspaceDeleteDialog
                    name={workspace.name}
                    onAction={handleDeleteWorkspace}
                    triggerState={deleteDialog.deleteWorkspaceDialogState}
                    isWorkspaceEmpty={isWorkspaceEmpty}
                />
            )}

            <EditNameDialog
                isLoading={editDialog.editWorkspaceMutation.isPending}
                triggerState={editDialog.editWorkspaceDialogState}
                onAction={handleEditDialog}
                key={workspace.id}
                defaultName={workspace.name}
                names={otherWorkspacesNames}
                title={'workspace name'}
                nameLimitations={{
                    maxLength: MAX_LENGTH_OF_WORKSPACE_NAME,
                    minLength: MIN_LENGTH_OF_WORKSPACE_NAME,
                }}
            />
        </>
    );
};
