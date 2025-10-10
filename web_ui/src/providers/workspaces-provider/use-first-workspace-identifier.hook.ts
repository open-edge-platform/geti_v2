// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useMemo } from 'react';

import { useWorkspacesApi } from '@geti/core/src/workspaces/hooks/use-workspaces.hook';
import { WorkspaceIdentifier } from '@geti/core/src/workspaces/services/workspaces.interface';
import { useParams } from 'react-router-dom';

import { useOrganizationIdentifier } from '../../hooks/use-organization-identifier/use-organization-identifier.hook';
import { NoWorkspacesError } from '../../pages/errors/no-workspaces.error';

export const useFirstWorkspaceIdentifier = () => {
    const { organizationId } = useOrganizationIdentifier();

    const { useWorkspacesQuery } = useWorkspacesApi(organizationId);
    const { data: workspaces } = useWorkspacesQuery();

    const { workspaceId = workspaces.at(0)?.id } = useParams<Pick<WorkspaceIdentifier, 'workspaceId'>>();

    if (workspaceId === undefined) {
        // No workspace found for user -> trigger global error boundary with dedicated screen
        throw new NoWorkspacesError();
    }

    return useMemo(() => ({ workspaceId, organizationId }), [workspaceId, organizationId]);
};
