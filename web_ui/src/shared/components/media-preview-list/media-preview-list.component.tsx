// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useState } from 'react';

import { DimensionValue, Responsive } from '@geti/ui';
import { isEmpty, isNil } from 'lodash-es';
import { useOverlayTriggerState } from 'react-stately';

import { getIds, hasEqualId } from '../../utils';
import { MediaItemsList } from '../media-items-list/media-items-list.component';
import { ViewModes } from '../media-view-modes/utils';
import { ImageOverlay } from './image-overlay.component';
import { MediaItem } from './media-item.component';
import { FileItem } from './util';

interface MediaPreviewListProps<T> {
    items: T[];
    viewMode: ViewModes;
    hasItemPreview?: boolean;
    hasLabelSelector?: boolean;
    height?: Responsive<DimensionValue>;
    onDeleteItem: (id: string) => Promise<unknown>;
    onUpdateItem: (id: string, item: T) => Promise<unknown>;
}

export const MediaPreviewList = <T extends FileItem>({
    items,
    height,
    viewMode,
    hasItemPreview = false,
    hasLabelSelector = true,
    onDeleteItem,
    onUpdateItem,
}: MediaPreviewListProps<T>): JSX.Element => {
    const dialogState = useOverlayTriggerState({});
    const [previewIndex, setPreviewIndex] = useState<null | number>(0);

    return (
        <>
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
                            onPress={() => {
                                setPreviewIndex(items.findIndex(hasEqualId(id)));
                                dialogState.open();
                            }}
                            height={'100%'}
                            url={dataUrl}
                            mediaFile={file}
                            labelIds={labelIds}
                            viewMode={viewMode}
                            hasItemPreview={hasItemPreview}
                            hasLabelSelector={hasLabelSelector}
                            onDeleteItem={onDeleteItem}
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
            {hasItemPreview && !isNil(previewIndex) && (
                <ImageOverlay
                    dialogState={dialogState}
                    items={items}
                    defaultIndex={previewIndex}
                    onDeleteItem={(id) => {
                        onDeleteItem(id).then(() => {
                            dialogState.close();
                            setPreviewIndex(null);
                        });
                    }}
                />
            )}
        </>
    );
};
