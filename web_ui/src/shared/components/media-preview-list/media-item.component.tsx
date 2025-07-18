// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useRef, useState } from 'react';

import { Loading, useUnwrapDOMRef, View, type DimensionValue, type Responsive } from '@geti/ui';
import { useOverlayTriggerState } from '@react-stately/overlays';
import { isEmpty, isNil } from 'lodash-es';
import { usePress } from 'react-aria';

import { Label } from '../../../core/labels/label.interface';
import { useTask } from '../../../pages/annotator/providers/task-provider/task-provider.component';
import { getSingleValidTask } from '../../../pages/camera-page/util';
import { isVideoFile, loadImageFromFile, loadVideoFromFile } from '../../media-utils';
import { ViewModes } from '../media-view-modes/utils';
import { CondensedLabelSelector } from './condensed-label-selector.component';
import { DeleteItemButton } from './delete-item-button.component';
import { ImageVideoFactory } from './image-video-factory.component';
import { MediaItemContextMenu } from './media-item-context-menu.component';

import classes from './media-item.module.scss';

export interface MediaItemProps {
    id: string;
    url: string | null | undefined;
    labelIds: string[];
    mediaFile: File;
    height?: Responsive<DimensionValue>;
    viewMode?: ViewModes;
    hasItemPreview: boolean;
    hasLabelSelector: boolean;
    onPress: (id: string) => void;
    onDeleteItem: (id: string) => void;
    onSelectLabel: (labels: Label[]) => void;
}

interface FileLoadingProps {
    file: File;
    onLoaded: (url: string) => void;
}

const FileLoading = ({ file, onLoaded }: FileLoadingProps) => {
    const loadHandler = isVideoFile(file) ? loadVideoFromFile : loadImageFromFile;

    useEffect(() => {
        loadHandler(file).then(({ src }) => onLoaded(src));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    return <Loading size='S' />;
};

export const MediaItem = ({
    id,
    url: initUrl,
    height,
    labelIds,
    viewMode,
    mediaFile,
    hasItemPreview,
    hasLabelSelector,
    onPress,
    onDeleteItem,
    onSelectLabel,
}: MediaItemProps): JSX.Element => {
    const { tasks } = useTask();
    const containerRef = useRef(null);
    const [url, setUrl] = useState(initUrl);

    const alertDialogState = useOverlayTriggerState({});
    const labelSelectorState = useOverlayTriggerState({});
    const unwrappedContainerRef = useUnwrapDOMRef(containerRef);
    const { pressProps } = usePress({ onPress: () => onPress(id) });

    const filteredTasks = getSingleValidTask(tasks);
    const taskLabels = filteredTasks.flatMap(({ labels }) => labels);

    const contextMenuOptions: [string, () => void][] = isEmpty(taskLabels)
        ? [['Delete', alertDialogState.toggle]]
        : [
              ['Delete', alertDialogState.toggle],
              ['Edit Label', labelSelectorState.open],
          ];

    if (isNil(url)) {
        return <FileLoading file={mediaFile} onLoaded={(newUrl) => setUrl(newUrl)} />;
    }

    return (
        <View ref={containerRef} UNSAFE_className={classes.container} height={height}>
            <ImageVideoFactory
                controls
                src={url}
                isVideoFile={isVideoFile(mediaFile)}
                alt={`media item ${id}`}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    cursor: hasItemPreview ? 'pointer' : 'default',
                }}
                {...pressProps}
            />

            <DeleteItemButton
                id={id}
                top={'size-50'}
                right={'size-50'}
                position={'absolute'}
                onDeleteItem={onDeleteItem}
                alertDialogState={alertDialogState}
                UNSAFE_className={[classes.deleteContainer, alertDialogState.isOpen ? classes.visible : ''].join(' ')}
            />
            {hasLabelSelector && (
                <CondensedLabelSelector
                    name={'Unlabeled'}
                    labelIds={labelIds}
                    right={'size-50'}
                    bottom={'size-50'}
                    viewMode={viewMode}
                    position={'absolute'}
                    isDisabled={isEmpty(taskLabels)}
                    triggerState={labelSelectorState}
                    selectedLabels={taskLabels.filter((label) => labelIds.includes(label.id))}
                    onSelectLabel={onSelectLabel}
                />
            )}
            <MediaItemContextMenu containerRef={unwrappedContainerRef} options={contextMenuOptions} />
        </View>
    );
};
