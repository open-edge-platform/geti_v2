// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Key, useEffect } from 'react';

import { useFeatureFlags } from '@geti/core/src/feature-flags/hooks/use-feature-flags.hook';
import { Flex, Item, Picker, Text } from '@geti/ui';

import { useWorkspaces } from '../../../providers/workspaces-provider/workspaces-provider.component';
import { hasEqualId } from '../../../shared/utils';
import { idMatchingFormat } from '../../../test-utils/id-utils';

const ALL_WORKSPACES = {
    id: '',
    text: 'All workspaces',
};

interface WorkspaceUsersPanelProps {
    selectedWorkspace: string | undefined;
    setSelectedWorkspace: (key: string | undefined) => void;
}

export const WorkspaceUsersPanel = ({ selectedWorkspace, setSelectedWorkspace }: WorkspaceUsersPanelProps) => {
    const { workspaces } = useWorkspaces();
    const { FEATURE_FLAG_WORKSPACE_ACTIONS } = useFeatureFlags();
    const items = [ALL_WORKSPACES, ...workspaces.map(({ id, name }) => ({ id, text: name }))];

    const onSelectionChange = (key: Key) => {
        const newSelectedWorkspace = workspaces.find(hasEqualId(key.toString()));
        setSelectedWorkspace(newSelectedWorkspace?.id ?? ALL_WORKSPACES.id);
    };

    const workspaceCreateDisabled = workspaces.length === 1 && !FEATURE_FLAG_WORKSPACE_ACTIONS;

    useEffect(() => {
        // Note: Default to the first workspace only when selection is truly unset (undefined).
        // Do not override an explicit 'All workspaces' selection (empty string).
        if (workspaceCreateDisabled && selectedWorkspace === undefined) {
            setSelectedWorkspace(workspaces[0].id);
        }
    }, [workspaceCreateDisabled, setSelectedWorkspace, workspaces, selectedWorkspace]);

    return (
        <Flex direction={'column'}>
            <Picker
                placeholder={'All workspaces'}
                id={'select-workspace-users-list-id'}
                data-testid={'select-workspace-users-list-id'}
                aria-label='Select workspace'
                items={items}
                selectedKey={selectedWorkspace}
                isDisabled={workspaceCreateDisabled}
                isQuiet={workspaceCreateDisabled}
                onSelectionChange={(key) => key !== null && onSelectionChange(key)}
            >
                {(item) => (
                    <Item key={item.id} textValue={item.text}>
                        <Text id={`${item.id}-${idMatchingFormat(item.text)}-id`}>{item.text}</Text>
                    </Item>
                )}
            </Picker>
        </Flex>
    );
};
