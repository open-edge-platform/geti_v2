// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useLocalStorage } from 'usehooks-ts';

import { getLastOpenedWorkspaceKey } from '../../shared/local-storage-keys';

export const useLastWorkspace = (organizationId: string, defaultWorkspaceId?: string) => {
    // Redirect to last opened workspace or the first available
    const [lastWorkspaceId, setLastWorkspaceId] = useLocalStorage(
        getLastOpenedWorkspaceKey(organizationId),
        defaultWorkspaceId
    );

    return {
        lastWorkspaceId,
        setLastWorkspaceId,
    };
};
