// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Key } from 'react';

import { paths } from '@geti/core';
import { useNavigate } from 'react-router-dom';

import { useOrganizationIdentifier } from '../../../../hooks/use-organization-identifier/use-organization-identifier.hook';
import { usePinnedCollapsedItems } from '../../../../hooks/use-pinned-collapsed-items/use-pinned-collapsed-items.hook';
import { PinnedCollapsedItemsAction } from '../../../../hooks/use-pinned-collapsed-items/use-pinned-collapsed-items.interface';
import { useWorkspaces } from '../../../../providers/workspaces-provider/workspaces-provider.component';
import { MAX_NUMBER_OF_DISPLAYED_WORKSPACES } from '../utils';

export const usePinnedCollapsedWorkspaces = () => {
    const navigate = useNavigate();
    const { organizationId } = useOrganizationIdentifier();

    const { workspaces, workspaceId: selectedWorkspaceId } = useWorkspaces();
    const [pinnedWorkspaces, collapsedWorkspaces, dispatch] = usePinnedCollapsedItems(
        workspaces,
        selectedWorkspaceId,
        MAX_NUMBER_OF_DISPLAYED_WORKSPACES
    );

    const selectWorkspace = (workspaceId: string) => {
        navigate(paths.workspace({ organizationId, workspaceId }));
    };

    const handleSelectWorkspace = (key: Key): void => {
        if (key === selectedWorkspaceId) {
            return;
        }

        selectWorkspace(String(key));
    };

    const handleSelectWorkspaceFromCollapsed = (key: Key): void => {
        const newSelectedWorkspaceId = String(key);

        dispatch({ type: PinnedCollapsedItemsAction.SWAP, payload: { id: newSelectedWorkspaceId } });

        selectWorkspace(newSelectedWorkspaceId);
    };

    return {
        workspaces,
        selectWorkspace,
        dispatchWorkspaces: dispatch,
        pinnedWorkspaces,
        collapsedWorkspaces,
        handleSelectWorkspace,
        handleSelectWorkspaceFromCollapsed,
        selectedWorkspaceId,
        numberOfWorkspaces: pinnedWorkspaces.length + collapsedWorkspaces.length,
    };
};
