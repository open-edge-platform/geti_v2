// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useFeatureFlags } from '@geti/core/src/feature-flags/hooks/use-feature-flags.hook';
import { useWorkspacesApi } from '@geti/core/src/workspaces/hooks/use-workspaces.hook';
import { ActionButton, Flex, Item, Loading, TabList, TabPanels, Tabs, Tooltip, TooltipTrigger } from '@geti/ui';
import { Add } from '@geti/ui/icons';
import { isEmpty } from 'lodash-es';

import { useOrganizationIdentifier } from '../../../hooks/use-organization-identifier/use-organization-identifier.hook';
import { PinnedCollapsedItemsAction } from '../../../hooks/use-pinned-collapsed-items/use-pinned-collapsed-items.interface';
import { CollapsedItemsPicker } from '../../../shared/components/collapsed-items-picker/collapsed-items-picker.component';
import { CustomTabItemWithMenu } from '../../../shared/components/custom-tab-item/custom-tab-item-with-menu.component';
import { CustomTabItem } from '../../../shared/components/custom-tab-item/custom-tab-item.component';
import { DeleteDialog } from '../../../shared/components/delete-dialog/delete-dialog.component';
import { EditNameDialog } from '../../../shared/components/edit-name-dialog/edit-name-dialog.component';
import { HasPermission } from '../../../shared/components/has-permission/has-permission.component';
import { OPERATION } from '../../../shared/components/has-permission/has-permission.interface';
import { TabItem } from '../../../shared/components/tabs/tabs.interface';
import { getUniqueNameFromArray, hasEqualId } from '../../../shared/utils';
import { MAX_LENGTH_OF_WORKSPACE_NAME, MIN_LENGTH_OF_WORKSPACE_NAME } from '../../user-management/workspaces/utils';
import { LandingPageWorkspace as Workspace } from '../landing-page-workspace/landing-page-workspace.component';
import { usePinnedCollapsedWorkspaces } from './hooks/use-pinned-collapsed-workspace.hook';
import { useWorkspaceActions } from './hooks/use-workspace-actions.hook';
import { MAX_NUMBER_OF_DISPLAYED_WORKSPACES } from './utils';

import classes from '../../../shared/components/custom-tab-item/custom-tab-item.module.scss';

export const WorkspacesTabs = (): JSX.Element => {
    const { organizationId } = useOrganizationIdentifier();
    const {
        workspaces,
        selectWorkspace,
        dispatchWorkspaces,
        selectedWorkspaceId,
        collapsedWorkspaces,
        pinnedWorkspaces,
        handleSelectWorkspace,
        numberOfWorkspaces,
    } = usePinnedCollapsedWorkspaces();
    const { FEATURE_FLAG_WORKSPACE_ACTIONS } = useFeatureFlags();

    const { items, handleMenuAction, editDialog, deleteDialog } = useWorkspaceActions(numberOfWorkspaces);
    const { useCreateWorkspaceMutation } = useWorkspacesApi(organizationId);
    const createWorkspace = useCreateWorkspaceMutation();
    const selectedWorkspace = workspaces.find(hasEqualId(selectedWorkspaceId));
    const otherWorkspacesNames = workspaces.filter(({ id }) => id !== selectedWorkspaceId).map(({ name }) => name);
    const hasSelectedPinnedItem = pinnedWorkspaces.find(hasEqualId(selectedWorkspaceId)) !== undefined;

    const pinnedItems: TabItem[] = pinnedWorkspaces.map(({ id, name }) => ({
        name,
        id: `${id === selectedWorkspaceId ? 'selected-' : ''}workspace-${id}`,
        key: id,
        children: <Workspace />,
    }));

    const collapsedItems = collapsedWorkspaces.map(({ id, name }) => ({ id, name }));

    const handleEditDialog = (newName: string): void => {
        const workspace = workspaces.find(hasEqualId(selectedWorkspaceId));

        if (workspace === undefined) {
            return;
        }

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
        const id = selectedWorkspaceId;

        deleteDialog.deleteWorkspaceMutation.mutate(
            { id },
            {
                onSuccess: () => {
                    selectWorkspace(workspaces[0].id);

                    dispatchWorkspaces({
                        type: PinnedCollapsedItemsAction.REMOVE,
                        payload: { id },
                    });

                    deleteDialog.deleteWorkspaceDialogState.close();
                },
            }
        );
    };

    const handleCreateWorkspace = (): void => {
        const uniqueName = getUniqueNameFromArray(
            workspaces.map(({ name }) => name),
            'Workspace '
        );

        createWorkspace.mutate(
            { name: uniqueName },
            {
                onSuccess: (workspace) => {
                    dispatchWorkspaces({ type: PinnedCollapsedItemsAction.CREATE, payload: workspace });

                    selectWorkspace(workspace.id);
                },
            }
        );
    };

    return (
        <Flex id={`page-layout-id`} direction='column' height='100%' UNSAFE_className={classes.componentWrapper}>
            <Tabs
                selectedKey={selectedWorkspaceId}
                items={pinnedItems}
                aria-label={'Workspaces tabs'}
                height={'100%'}
                width={'100%'}
                orientation={'vertical'}
                onSelectionChange={handleSelectWorkspace}
            >
                <Flex width={'100%'} alignItems={'center'} UNSAFE_className={classes.tabWrapper}>
                    <TabList UNSAFE_className={classes.tabList}>
                        {(item: TabItem) => (
                            <Item textValue={item.name as string} key={item.key}>
                                <>
                                    <Flex alignItems={'center'}>
                                        {selectedWorkspaceId === item.key && FEATURE_FLAG_WORKSPACE_ACTIONS ? (
                                            <HasPermission
                                                operations={[OPERATION.WORKSPACE_MANAGEMENT]}
                                                Fallback={
                                                    <CustomTabItem
                                                        name={item.name as string}
                                                        isMoreIconVisible={false}
                                                    />
                                                }
                                            >
                                                <CustomTabItemWithMenu
                                                    name={item.name as string}
                                                    isMoreIconVisible={item.key === selectedWorkspaceId}
                                                    id={item.id as string}
                                                    items={items}
                                                    onAction={handleMenuAction}
                                                />
                                            </HasPermission>
                                        ) : (
                                            <CustomTabItem name={item.name as string} isMoreIconVisible={false} />
                                        )}
                                    </Flex>
                                </>
                            </Item>
                        )}
                    </TabList>

                    {numberOfWorkspaces > MAX_NUMBER_OF_DISPLAYED_WORKSPACES && (
                        <CollapsedItemsPicker
                            hasSelectedPinnedItem={hasSelectedPinnedItem}
                            numberOfCollapsedItems={collapsedItems.length}
                            onSelectionChange={handleSelectWorkspace}
                            items={collapsedItems}
                            ariaLabel={'Collapsed workspaces'}
                        />
                    )}

                    {FEATURE_FLAG_WORKSPACE_ACTIONS && (
                        <HasPermission operations={[OPERATION.WORKSPACE_CREATION]}>
                            <TooltipTrigger placement={'bottom'}>
                                <ActionButton
                                    isQuiet
                                    id={'create-new-workspace-id'}
                                    aria-label={'Create new workspace'}
                                    onPress={handleCreateWorkspace}
                                    isDisabled={createWorkspace.isPending}
                                >
                                    {createWorkspace.isPending ? <Loading mode='inline' size={'S'} /> : <Add />}
                                </ActionButton>
                                <Tooltip>Create a new workspace</Tooltip>
                            </TooltipTrigger>
                        </HasPermission>
                    )}
                </Flex>
                <TabPanels>
                    {(item: TabItem) => (
                        <Item key={item.key}>
                            <HasPermission
                                operations={[OPERATION.CAN_SEE_WORKSPACE]}
                                specialCondition={!FEATURE_FLAG_WORKSPACE_ACTIONS || undefined}
                                Fallback={<div data-testid='no-permission-to-tab'>TODO: no permission</div>}
                            >
                                {item.children}
                            </HasPermission>
                        </Item>
                    )}
                </TabPanels>
            </Tabs>

            {FEATURE_FLAG_WORKSPACE_ACTIONS && !isEmpty(selectedWorkspace) && (
                <HasPermission operations={[OPERATION.WORKSPACE_MANAGEMENT]}>
                    <DeleteDialog
                        name={selectedWorkspace.name}
                        title={'workspace'}
                        onAction={handleDeleteWorkspace}
                        triggerState={deleteDialog.deleteWorkspaceDialogState}
                    />
                    <EditNameDialog
                        isLoading={editDialog.editWorkspaceMutation.isPending}
                        triggerState={editDialog.editWorkspaceDialogState}
                        onAction={handleEditDialog}
                        key={selectedWorkspaceId}
                        defaultName={selectedWorkspace.name}
                        names={otherWorkspacesNames}
                        title={'workspace name'}
                        nameLimitations={{
                            maxLength: MAX_LENGTH_OF_WORKSPACE_NAME,
                            minLength: MIN_LENGTH_OF_WORKSPACE_NAME,
                        }}
                    />
                </HasPermission>
            )}
        </Flex>
    );
};
