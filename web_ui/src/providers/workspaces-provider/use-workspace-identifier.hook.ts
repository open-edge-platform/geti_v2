// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useMemo } from 'react';

import { WorkspaceIdentifier } from '@geti/core/src/workspaces/services/workspaces.interface';
import { isEqual } from 'lodash-es';
import { useParams } from 'react-router-dom';

import { useLastWorkspace } from '../../hooks/use-last-workspace/use-last-workspace.hook';
import { useOrganizationIdentifier } from '../../hooks/use-organization-identifier/use-organization-identifier.hook';
import { useWorkspaces } from './workspaces-provider.component';

export const useWorkspaceIdentifier = (): WorkspaceIdentifier => {
    // Use an empty string so that our unit tests won't fail due to react router not being
    // set up properly
    const { organizationId } = useOrganizationIdentifier();
    const { workspaceId } = useParams<Pick<WorkspaceIdentifier, 'workspaceId'>>();
    const { lastWorkspaceId, setLastWorkspaceId } = useLastWorkspace(organizationId, workspaceId);
    const { workspaces } = useWorkspaces();

    useEffect(() => {
        if (workspaceId && !isEqual(lastWorkspaceId, workspaceId)) {
            setLastWorkspaceId(workspaceId);
        }
    }, [workspaceId, setLastWorkspaceId, lastWorkspaceId]);

    // eslint-disable-next-line max-len
    // For urls lacking workspaceId (workspaceId is empty) we use the lastWorkspaceId if it exists, and if not, we default to the first workspace in the list
    const resolvedWorkspaceId =
        workspaceId !== undefined ? workspaceId : lastWorkspaceId !== undefined ? lastWorkspaceId : workspaces[0].id;

    return useMemo(() => ({ workspaceId: resolvedWorkspaceId, organizationId }), [resolvedWorkspaceId, organizationId]);
};
