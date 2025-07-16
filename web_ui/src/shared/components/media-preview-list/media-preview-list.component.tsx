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
    height?: Responsive<DimensionValue>;
    onDeleteItem: (id: string) => Promise<unknown>;
    onUpdateItem: (id: string, item: Omit<Partial<T>, 'id'>) => Promise<unknown>;
}

export const MediaPreviewList = <T extends FileItem>({
    items,
    height,
    viewMode,
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
                itemContent={(screenshot) => {
                    const { id, ...itemData } = screenshot;

                    return (
                        <MediaItem
                            id={id}
                            key={id}
                            onPress={() => {
                                setPreviewIndex(items.findIndex(hasEqualId(id)));
                                dialogState.open();
                            }}
                            height={'100%'}
                            viewMode={viewMode}
                            mediaFile={itemData.file}
                            url={itemData.dataUrl}
                            labelIds={itemData.labelIds}
                            onDeleteItem={onDeleteItem}
                            onSelectLabel={(newLabels) => {
                                if (isEmpty(newLabels)) {
                                    onUpdateItem(id, { ...itemData, labelIds: [], labelName: null });
                                } else {
                                    const newLabelIds = getIds(newLabels);
                                    const newLabelName = newLabels.at(-1)?.name || null;

                                    onUpdateItem(id, { ...itemData, labelIds: newLabelIds, labelName: newLabelName });
                                }
                            }}
                        />
                    );
                }}
            />
            {!isNil(previewIndex) && (
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
