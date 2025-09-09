// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useMemo, useRef } from 'react';

import { useFeatureFlags } from '@geti/core/src/feature-flags/hooks/use-feature-flags.hook';
import { useWorkspacesApi } from '@geti/core/src/workspaces/hooks/use-workspaces.hook';
import { WorkspaceEntity } from '@geti/core/src/workspaces/services/workspaces.interface';
import { ActionButton, Flex, Item, Loading, TabList, TabPanels, Tabs, Tooltip, TooltipTrigger } from '@geti/ui';
import { Add } from '@geti/ui/icons';

import { useOrganizationIdentifier } from '../../../hooks/use-organization-identifier/use-organization-identifier.hook';
import { PinnedCollapsedItemsAction } from '../../../hooks/use-pinned-collapsed-items/use-pinned-collapsed-items.interface';
import { useSize } from '../../../hooks/use-size/use-size.hook';
import { CollapsedItemsPicker } from '../../../shared/components/collapsed-items-picker/collapsed-items-picker.component';
import { CustomTabItem } from '../../../shared/components/custom-tab-item/custom-tab-item.component';
import { HasPermission } from '../../../shared/components/has-permission/has-permission.component';
import { OPERATION } from '../../../shared/components/has-permission/has-permission.interface';
import { TabItem } from '../../../shared/components/tabs/tabs.interface';
import { getUniqueNameFromArray, hasEqualId } from '../../../shared/utils';
import { LandingPageWorkspace as Workspace } from '../landing-page-workspace/landing-page-workspace.component';
import { NoPermissionPlaceholder } from './components/no-permission-placeholder.component';
import { CustomTabItemWithMenu } from './custom-tab-item-with-menu.component';
import { usePinnedCollapsedWorkspaces } from './hooks/use-pinned-collapsed-workspace.hook';
import { MAX_NUMBER_OF_DISPLAYED_WORKSPACES } from './utils';

import classes from '../../../shared/components/custom-tab-item/custom-tab-item.module.scss';

export const WorkspacesTabs = () => {
    const { organizationId } = useOrganizationIdentifier();
    const {
        workspaces,
        selectWorkspace,
        dispatchWorkspaces,
        selectedWorkspaceId,
        collapsedWorkspaces,
        pinnedWorkspaces,
        handleSelectWorkspace,
        handleSelectWorkspaceFromCollapsed,
        numberOfWorkspaces,
    } = usePinnedCollapsedWorkspaces();
    const { FEATURE_FLAG_WORKSPACE_ACTIONS } = useFeatureFlags();

    const tabBarRef = useRef<HTMLDivElement | null>(null);
    const barSize = useSize(tabBarRef);
    const dynamicMaxDisplayed = useMemo(() => {
        if (!barSize || barSize.width <= 0) return MAX_NUMBER_OF_DISPLAYED_WORKSPACES;
        const available = barSize.width;
        // Reserve width for create button (if visible ~40), dropdown (~90 when present), padding/margins (~32)
        const reservedBase = 32 + (FEATURE_FLAG_WORKSPACE_ACTIONS ? 40 : 0);
        const reserved = reservedBase + 90; // dropdown spot
        const approxTabWidth = 140; // avg width per tab
        const fit = Math.max(1, Math.floor((available - reserved) / approxTabWidth));
        return Math.min(MAX_NUMBER_OF_DISPLAYED_WORKSPACES, fit);
    }, [barSize, FEATURE_FLAG_WORKSPACE_ACTIONS]);

    const { useCreateWorkspaceMutation } = useWorkspacesApi(organizationId);
    const createWorkspace = useCreateWorkspaceMutation();
    const selectedWorkspace = workspaces.find(hasEqualId(selectedWorkspaceId));

    const effectivePinned = useMemo(() => {
        const capacity = Math.max(1, dynamicMaxDisplayed);
        let base = pinnedWorkspaces.length <= capacity ? [...pinnedWorkspaces] : pinnedWorkspaces.slice(0, capacity);

        const selectedAlreadyIncluded = base.find(hasEqualId(selectedWorkspaceId)) !== undefined;
        if (!selectedAlreadyIncluded) {
            const selectedFromPinned = pinnedWorkspaces.find(hasEqualId(selectedWorkspaceId));
            const selectedFromCollapsed = collapsedWorkspaces.find(hasEqualId(selectedWorkspaceId));
            const selectedCandidate = selectedFromPinned || selectedFromCollapsed;
            if (selectedCandidate) {
                if (base.length >= capacity) {
                    base = [...base.slice(0, capacity - 1), selectedCandidate];
                } else {
                    base = [...base, selectedCandidate];
                }
            }
        }
        return base;
    }, [pinnedWorkspaces, collapsedWorkspaces, dynamicMaxDisplayed, selectedWorkspaceId]);

    const hasSelectedPinnedItem = effectivePinned.find(hasEqualId(selectedWorkspaceId)) !== undefined;

    const effectivePinnedIds = new Set(effectivePinned.map((w) => w.id));
    const additionalOverflow = pinnedWorkspaces.filter((w) => !effectivePinnedIds.has(w.id));

    const pinnedItems: TabItem[] = effectivePinned.map(({ id, name }) => ({
        name,
        id: `${id === selectedWorkspaceId ? 'selected-' : ''}workspace-${id}`,
        key: id,
        children: <Workspace />,
    }));
    const collapsedItems = [
        ...additionalOverflow,
        ...collapsedWorkspaces.filter((w) => !effectivePinnedIds.has(w.id)),
    ].map(({ id, name }) => ({ id, name }));

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
                <div ref={tabBarRef} style={{ width: '100%' }}>
                    <Flex width={'100%'} alignItems={'center'} UNSAFE_className={classes.tabWrapper}>
                        <TabList UNSAFE_className={classes.tabList}>
                            {(item: TabItem) => (
                                <Item textValue={item.name as string} key={item.key}>
                                    <>
                                        <Flex alignItems={'center'}>
                                            {selectedWorkspaceId === item.key && FEATURE_FLAG_WORKSPACE_ACTIONS ? (
                                                <HasPermission
                                                    operations={[OPERATION.WORKSPACE_MANAGEMENT]}
                                                    specialCondition={true}
                                                    Fallback={
                                                        <CustomTabItem
                                                            name={item.name as string}
                                                            isMoreIconVisible={false}
                                                        />
                                                    }
                                                >
                                                    <CustomTabItemWithMenu
                                                        workspace={selectedWorkspace as WorkspaceEntity}
                                                        isMoreIconVisible={item.key === selectedWorkspaceId}
                                                        workspaces={workspaces}
                                                        dispatchWorkspaces={dispatchWorkspaces}
                                                        selectWorkspace={selectWorkspace}
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

                        {numberOfWorkspaces > effectivePinned.length && collapsedItems.length > 0 && (
                            <CollapsedItemsPicker
                                key={`collapsed-picker-${collapsedItems.length}-${selectedWorkspaceId}`}
                                hasSelectedPinnedItem={hasSelectedPinnedItem}
                                numberOfCollapsedItems={collapsedItems.length}
                                onSelectionChange={handleSelectWorkspaceFromCollapsed}
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
                </div>
                <TabPanels>
                    {(item: TabItem) => (
                        <Item key={item.key}>
                            <HasPermission
                                operations={[OPERATION.CAN_SEE_WORKSPACE]}
                                specialCondition={!FEATURE_FLAG_WORKSPACE_ACTIONS || undefined}
                                Fallback={<NoPermissionPlaceholder />}
                            >
                                {item.children}
                            </HasPermission>
                        </Item>
                    )}
                </TabPanels>
            </Tabs>
        </Flex>
    );
};
