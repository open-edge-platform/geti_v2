// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Key } from 'react';

import { paths } from '@geti/core';
import { useNavigate } from 'react-router-dom';

import { useOrganizationIdentifier } from '../../../../hooks/use-organization-identifier/use-organization-identifier.hook';
import { useWorkspaces } from '../../../../providers/workspaces-provider/workspaces-provider.component';

export const useWorkspacesTabs = () => {
    const navigate = useNavigate();
    const { organizationId } = useOrganizationIdentifier();

    const { workspaces, workspaceId: selectedWorkspaceId } = useWorkspaces();
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

        selectWorkspace(newSelectedWorkspaceId);
    };

    return {
        workspaces,
        selectWorkspace,
        handleSelectWorkspace,
        handleSelectWorkspaceFromCollapsed,
        selectedWorkspaceId,
        numberOfWorkspaces: workspaces.length,
    };
};
