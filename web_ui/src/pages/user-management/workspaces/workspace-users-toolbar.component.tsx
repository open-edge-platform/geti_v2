// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Key } from 'react';

import { useFeatureFlags } from '@geti/core/src/feature-flags/hooks/use-feature-flags.hook';
import { useActiveUser } from '@geti/core/src/users/hook/use-users.hook';
import { isOrganizationAdmin } from '@geti/core/src/users/user-role-utils';
import { RESOURCE_TYPE } from '@geti/core/src/users/users.interface';
import { useWorkspacesApi } from '@geti/core/src/workspaces/hooks/use-workspaces.hook';
import { WorkspaceEntity } from '@geti/core/src/workspaces/services/workspaces.interface';
import { ActionButton, Flex, Item, Loading, TabList, Tabs, Tooltip, TooltipTrigger, View } from '@geti/ui';
import { Add } from '@geti/ui/icons';

import { useProjectActions } from '../../../core/projects/hooks/use-project-actions.hook';
import { useOrganizationIdentifier } from '../../../hooks/use-organization-identifier/use-organization-identifier.hook';
import { CustomTabItem } from '../../../shared/components/custom-tab-item/custom-tab-item.component';
import { EditNameDialog } from '../../../shared/components/edit-name-dialog/edit-name-dialog.component';
import { HasPermission } from '../../../shared/components/has-permission/has-permission.component';
import { OPERATION } from '../../../shared/components/has-permission/has-permission.interface';
import { getUniqueNameFromArray } from '../../../shared/utils';
import { WorkspaceDeleteDialog } from '../../landing-page/workspaces-tabs/components/workspace-delete-dialog.component';
import { CustomTabItemWithMenu } from '../../landing-page/workspaces-tabs/custom-tab-item-with-menu.component';
import { useWorkspaceActions } from '../../landing-page/workspaces-tabs/hooks/use-workspace-actions.hook';

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
    const { organizationId } = useOrganizationIdentifier();
    const { data: activeUser } = useActiveUser(organizationId);
    const { useCreateWorkspaceMutation } = useWorkspacesApi(organizationId);
    const { useGetProjectNames } = useProjectActions();
    const createWorkspace = useCreateWorkspaceMutation();

    const { FEATURE_FLAG_WORKSPACE_ACTIONS } = useFeatureFlags();

    const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);
    const projectsNamesQuery = useGetProjectNames({ organizationId, workspaceId: selectedWorkspace!.id });
    const isWorkspaceEmpty = projectsNamesQuery.data?.projects.length === 0;

    const { deleteDialog, editDialog } = useWorkspaceActions(workspaces.length, isWorkspaceEmpty, selectedWorkspaceId);

    const tabItems = workspaces.map((w) => ({ key: w.id, name: w.name }));

    const handleSelection = (key: Key) => {
        onSelectWorkspace(key.toString());
    };

    const handleCreateWorkspace = () => {
        const unique = getUniqueNameFromArray(
            workspaces.map((w) => w.name),
            'Workspace '
        );
        createWorkspace.mutate({ name: unique });
    };

    return (
        <Flex direction={'column'} gap={'size-150'}>
            <Tabs
                selectedKey={selectedWorkspaceId}
                onSelectionChange={handleSelection}
                aria-label={'Workspace tabs'}
                items={tabItems}
            >
                <Flex alignItems={'center'} gap={'size-200'} UNSAFE_style={{ overflow: 'hidden' }}>
                    <TabList width={'100%'}>
                        {(item: { key: string; name: string }) => {
                            return (
                                <Item key={item.key} textValue={item.name}>
                                    {item.key === selectedWorkspaceId && FEATURE_FLAG_WORKSPACE_ACTIONS ? (
                                        <View marginTop={'size-65'}>
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
                                        </View>
                                    ) : (
                                        <View>
                                            <CustomTabItem isMoreIconVisible={false} name={item.name} />
                                        </View>
                                    )}
                                </Item>
                            );
                        }}
                    </TabList>
                    {FEATURE_FLAG_WORKSPACE_ACTIONS && (
                        <HasPermission operations={[OPERATION.WORKSPACE_CREATION]}>
                            <TooltipTrigger placement={'bottom'}>
                                <ActionButton
                                    isQuiet
                                    aria-label={'Create workspace'}
                                    id={'create-workspace-toolbar-btn'}
                                    onPress={handleCreateWorkspace}
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
            {/* Dialogs for selected workspace */}
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
                    isWorkspaceEmpty={isWorkspaceEmpty}
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
        </Flex>
    );
};
