// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useMemo } from 'react';

import { WorkspaceIdentifier } from '@geti/core/src/workspaces/services/workspaces.interface';
import { isEqual } from 'lodash-es';
import { useParams } from 'react-router-dom';

import { useLastWorkspace } from '../../hooks/use-last-workspace/use-last-workspace.hook';
import { useOrganizationIdentifier } from '../../hooks/use-organization-identifier/use-organization-identifier.hook';

export const useWorkspaceIdentifier = (): WorkspaceIdentifier => {
    // Use an empty string so that our unit tests won't fail due to react router not being
    // set up properly
    const { organizationId } = useOrganizationIdentifier();
    const { workspaceId = '' } = useParams<Pick<WorkspaceIdentifier, 'workspaceId'>>();

    const { lastWorkspaceId, setLastWorkspaceId } = useLastWorkspace(organizationId, workspaceId);

    useEffect(() => {
        if (!isEqual(lastWorkspaceId, workspaceId)) {
            setLastWorkspaceId(workspaceId);
        }
    }, [workspaceId, setLastWorkspaceId, lastWorkspaceId]);

    return useMemo(() => ({ workspaceId, organizationId }), [workspaceId, organizationId]);
};
