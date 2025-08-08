// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode } from 'react';

import { DimensionValue, Responsive, Selection } from '@geti/ui';
import { isEmpty } from 'lodash-es';

import { getId, getIds } from '../../utils';
import { MediaItemsList } from '../media-items-list/media-items-list.component';
import { ViewModes } from '../media-view-modes/utils';
import { MediaItem } from './media-item.component';
import { FileItem } from './util';

interface MediaPreviewListProps<T> {
    items: T[];
    viewMode: ViewModes;
    height?: Responsive<DimensionValue>;
    selectedKeys?: Selection;
    hasLabelSelector?: boolean;
    onUpdateItem: (id: string, item: T) => void;
    topLeftElement?: (id: string) => ReactNode;
    topRightElement?: (id: string) => ReactNode;
    onSelectionChange?: (keys: Selection) => void;
}

export const MediaPreviewList = <T extends FileItem>({
    items,
    height,
    viewMode,
    selectedKeys,
    hasLabelSelector = true,
    onUpdateItem,
    topLeftElement,
    topRightElement,
    onSelectionChange,
}: MediaPreviewListProps<T>): JSX.Element => {
    return (
        <MediaItemsList
            height={height}
            viewMode={viewMode}
            mediaItems={items}
            selectedKeys={selectedKeys}
            idFormatter={getId}
            selectionMode='multiple'
            onSelectionChange={onSelectionChange}
            getTextValue={(item) => item.file.name}
            itemContent={(item) => {
                const { id, dataUrl, labelIds, file } = item;

                return (
                    <MediaItem
                        id={id}
                        key={id}
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
