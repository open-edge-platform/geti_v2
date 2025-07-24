// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode } from 'react';

import { DimensionValue, Responsive } from '@geti/ui';
import { isEmpty } from 'lodash-es';

import { getIds } from '../../utils';
import { MediaItemsList } from '../media-items-list/media-items-list.component';
import { ViewModes } from '../media-view-modes/utils';
import { MediaItem } from './media-item.component';
import { FileItem } from './util';

interface MediaPreviewListProps<T> {
    items: T[];
    viewMode: ViewModes;
    hasLabelSelector?: boolean;
    height?: Responsive<DimensionValue>;
    onPress?: (id: string) => void;
    onUpdateItem: (id: string, item: T) => Promise<unknown>;
    topLeftElement?: (id: string) => ReactNode;
    topRightElement?: (id: string) => ReactNode;
}

export const MediaPreviewList = <T extends FileItem>({
    items,
    height,
    viewMode,
    hasLabelSelector = true,
    onPress,
    onUpdateItem,
    topLeftElement,
    topRightElement,
}: MediaPreviewListProps<T>): JSX.Element => {
    return (
        <MediaItemsList
            viewMode={viewMode}
            mediaItems={items}
            height={height}
            idFormatter={(item) => item.id}
            getTextValue={(item) => item.file.name}
            itemContent={(item) => {
                const { id, dataUrl, labelIds, file } = item;

                return (
                    <MediaItem
                        id={id}
                        key={id}
                        onPress={onPress}
                        height={'100%'}
                        url={dataUrl}
                        mediaFile={file}
                        labelIds={labelIds}
                        viewMode={viewMode}
                        hasLabelSelector={hasLabelSelector}
                        topLeftElement={topLeftElement}
                        topRightElement={topRightElement}
                        onSelectLabel={(newLabels) => {
                            if (isEmpty(newLabels)) {
                                onUpdateItem(id, { ...item, labelIds: [], labelName: null });
                            } else {
                                const newLabelIds = getIds(newLabels);
                                const newLabelName = newLabels.at(-1)?.name || null;

                                onUpdateItem(id, { ...item, labelIds: newLabelIds, labelName: newLabelName });
                            }
                        }}
                    />
                );
            }}
        />
    );
};
