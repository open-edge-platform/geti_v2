// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Dispatch, SetStateAction } from 'react';

import { Flex, Item, Key, Picker, Text } from '@geti/ui';

import { MediaViewModes } from '../../../../../shared/components/media-view-modes/media-view-modes.component';
import { ViewModes } from '../../../../../shared/components/media-view-modes/utils';
import { SortingOptions } from './utils';

interface PreviewMediaToolbarProps {
    viewMode: ViewModes;
    onSortItems: (option: Key) => void;
    onViewModeChange: Dispatch<SetStateAction<ViewModes>>;
}

export const PreviewMediaToolbar = ({ viewMode, onSortItems, onViewModeChange }: PreviewMediaToolbarProps) => {
    return (
        <Flex gap={'size-400'} alignItems={'center'} marginStart={'auto'}>
            <Flex alignItems={'center'} gap={'size-100'}>
                <Text UNSAFE_style={{ fontWeight: 'bold' }}>Sort by: </Text>

                <Picker
                    isQuiet
                    maxWidth={'size-2000'}
                    aria-label='sorting options'
                    onSelectionChange={(key) => key !== null && onSortItems(key)}
                >
                    <Item key={SortingOptions.LABEL_NAME_A_Z}>Label Name (A-Z)</Item>
                    <Item key={SortingOptions.LABEL_NAME_Z_A}>Label Name (Z-A)</Item>
                </Picker>
            </Flex>
            <Flex gap={'size-100'} alignItems={'center'}>
                <Text>{viewMode}</Text>
                <MediaViewModes
                    viewMode={viewMode}
                    setViewMode={onViewModeChange}
                    items={[ViewModes.LARGE, ViewModes.MEDIUM, ViewModes.SMALL]}
                />
            </Flex>
        </Flex>
    );
};
