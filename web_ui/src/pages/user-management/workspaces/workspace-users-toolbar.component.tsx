// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Key } from 'react';

import { useFeatureFlags } from '@geti/core/src/feature-flags/hooks/use-feature-flags.hook';
import { useActiveUser } from '@geti/core/src/users/hook/use-users.hook';
import { isOrganizationAdmin } from '@geti/core/src/users/user-role-utils';
import { RESOURCE_TYPE } from '@geti/core/src/users/users.interface';
import { useWorkspacesApi } from '@geti/core/src/workspaces/hooks/use-workspaces.hook';
import { WorkspaceEntity } from '@geti/core/src/workspaces/services/workspaces.interface';
import { ActionButton, Flex, Item, Loading, TabList, Tabs, Tooltip, TooltipTrigger } from '@geti/ui';
import { Add } from '@geti/ui/icons';
import { useOverlayTriggerState } from 'react-stately';

import { useOrganizationIdentifier } from '../../../hooks/use-organization-identifier/use-organization-identifier.hook';
import { CustomTabItem } from '../../../shared/components/custom-tab-item/custom-tab-item.component';
import { EditNameDialog } from '../../../shared/components/edit-name-dialog/edit-name-dialog.component';
import { HasPermission } from '../../../shared/components/has-permission/has-permission.component';
import { OPERATION } from '../../../shared/components/has-permission/has-permission.interface';
import { WorkspaceDeleteDialog } from '../../landing-page/workspaces-tabs/components/workspace-delete-dialog.component';
import { CustomTabItemWithMenu } from '../../landing-page/workspaces-tabs/custom-tab-item-with-menu.component';
import { useWorkspaceActions } from '../../landing-page/workspaces-tabs/hooks/use-workspace-actions.hook';
import { CreateWorkspaceDialog } from './create-workspace-dialog/create-workspace-dialog.component';

import classes from '../../../shared/components/custom-tab-item/custom-tab-item.module.scss';

interface WorkspaceUsersToolbarProps {
    workspaces: WorkspaceEntity[];
    selectedWorkspaceId: string | undefined;
    onSelectWorkspace: (id: string) => void;
}

export const WorkspaceUsersToolbar = ({
    workspaces,
    selectedWorkspaceId,
    onSelectWorkspace,
}: WorkspaceUsersToolbarProps) => {
    const createWorkspaceDialogState = useOverlayTriggerState({});
    const { organizationId } = useOrganizationIdentifier();
    const { data: activeUser } = useActiveUser(organizationId);
    const { useCreateWorkspaceMutation } = useWorkspacesApi(organizationId);
    const createWorkspace = useCreateWorkspaceMutation();

    const { FEATURE_FLAG_WORKSPACE_ACTIONS } = useFeatureFlags();

    const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);

    const { deleteDialog, editDialog } = useWorkspaceActions(workspaces.length, selectedWorkspaceId);

    const tabItems = workspaces.map((workspace) => ({ key: workspace.id, name: workspace.name }));
    const workspacesNames = workspaces.map((workspace) => workspace.name);

    const handleSelection = (key: Key) => {
        onSelectWorkspace(key.toString());
    };

    return (
        <Flex direction={'column'} gap={'size-150'} UNSAFE_className={classes.componentWrapper}>
            <Tabs
                selectedKey={selectedWorkspaceId}
                onSelectionChange={handleSelection}
                aria-label={'Workspace tabs'}
                items={tabItems}
                orientation='vertical'
            >
                <Flex alignItems={'center'} gap={'size-200'} UNSAFE_className={classes.tabWrapper}>
                    <div className={classes.tabListScrollContainer}>
                        <TabList UNSAFE_className={classes.tabList}>
                            {(item: { key: string; name: string }) => {
                                return (
                                    <Item key={item.key} textValue={item.name}>
                                        {item.key === selectedWorkspaceId && FEATURE_FLAG_WORKSPACE_ACTIONS ? (
                                            <HasPermission
                                                operations={[OPERATION.WORKSPACE_MANAGEMENT]}
                                                resources={[{ type: RESOURCE_TYPE.WORKSPACE, id: item.key }]}
                                                specialCondition={
                                                    activeUser !== undefined &&
                                                    isOrganizationAdmin(activeUser, organizationId)
                                                }
                                                Fallback={<CustomTabItem name={item.name} isMoreIconVisible={false} />}
                                            >
                                                <CustomTabItemWithMenu
                                                    workspace={selectedWorkspace as WorkspaceEntity}
                                                    isMoreIconVisible={item.key === selectedWorkspaceId}
                                                    workspaces={workspaces}
                                                    selectWorkspace={(id: string) => handleSelection(id)}
                                                />
                                            </HasPermission>
                                        ) : (
                                            <CustomTabItem isMoreIconVisible={false} name={item.name} />
                                        )}
                                    </Item>
                                );
                            }}
                        </TabList>
                    </div>
                    {FEATURE_FLAG_WORKSPACE_ACTIONS && (
                        <HasPermission operations={[OPERATION.WORKSPACE_CREATION]}>
                            <TooltipTrigger placement={'bottom'}>
                                <ActionButton
                                    isQuiet
                                    aria-label={'Create workspace'}
                                    id={'create-workspace-toolbar-btn'}
                                    onPress={createWorkspaceDialogState.open}
                                    isDisabled={createWorkspace.isPending}
                                >
                                    {createWorkspace.isPending ? <Loading mode='inline' size={'S'} /> : <Add />}
                                </ActionButton>
                                <Tooltip>Create workspace</Tooltip>
                            </TooltipTrigger>
                        </HasPermission>
                    )}
                </Flex>
            </Tabs>
            {selectedWorkspace && deleteDialog.deleteWorkspaceDialogState.isOpen && (
                <WorkspaceDeleteDialog
                    name={selectedWorkspace.name}
                    onAction={() => {
                        deleteDialog.deleteWorkspaceMutation.mutate(
                            { id: selectedWorkspace.id },
                            { onSuccess: () => deleteDialog.deleteWorkspaceDialogState.close() }
                        );
                    }}
                    triggerState={deleteDialog.deleteWorkspaceDialogState}
                    workspaceId={selectedWorkspace.id}
                />
            )}
            {selectedWorkspace && editDialog.editWorkspaceDialogState.isOpen && (
                <EditNameDialog
                    isLoading={editDialog.editWorkspaceMutation.isPending}
                    triggerState={editDialog.editWorkspaceDialogState}
                    onAction={(newName) =>
                        editDialog.editWorkspaceMutation.mutate(
                            { ...selectedWorkspace, name: newName },
                            { onSuccess: () => editDialog.editWorkspaceDialogState.close() }
                        )
                    }
                    defaultName={selectedWorkspace.name}
                    names={workspaces.map((w) => w.name).filter((n) => n !== selectedWorkspace.name)}
                    title={'workspace name'}
                    nameLimitations={{ maxLength: 64, minLength: 1 }}
                />
            )}
            <CreateWorkspaceDialog
                triggerState={createWorkspaceDialogState}
                names={workspacesNames}
                nameLimitations={{ maxLength: 64, minLength: 1 }}
            />
        </Flex>
    );
};
