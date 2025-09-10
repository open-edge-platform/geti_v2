// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode, useEffect, useRef, useState } from 'react';

import { Loading, useUnwrapDOMRef, View, ViewModes, type DimensionValue, type Responsive } from '@geti/ui';
import { useOverlayTriggerState } from '@react-stately/overlays';
import { clsx } from 'clsx';
import { isEmpty, isFunction, isNil } from 'lodash-es';

import { Label } from '../../../core/labels/label.interface';
import { useTask } from '../../../pages/annotator/providers/task-provider/task-provider.component';
import { getSingleValidTask } from '../../../pages/utils';
import { isVideoFile, loadImageFromFile, loadVideoFromFile } from '../../media-utils';
import { CondensedLabelSelector } from './condensed-label-selector.component';
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
    hasLabelSelector: boolean;
    onSelectLabel: (labels: Label[]) => void;
    topLeftElement?: (id: string) => ReactNode;
    topRightElement?: (id: string) => ReactNode;
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
    hasLabelSelector,
    onSelectLabel,
    topLeftElement,
    topRightElement,
}: MediaItemProps) => {
    const { tasks } = useTask();
    const containerRef = useRef(null);
    const [url, setUrl] = useState(initUrl);

    const alertDialogState = useOverlayTriggerState({});
    const labelSelectorState = useOverlayTriggerState({});
    const unwrappedContainerRef = useUnwrapDOMRef(containerRef);

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
                    cursor: 'pointer',
                }}
            />

            {isFunction(topLeftElement) && (
                <View UNSAFE_className={clsx(classes.leftTopElement, classes.floatingContainer)}>
                    {topLeftElement(id)}
                </View>
            )}

            {isFunction(topRightElement) && (
                <View UNSAFE_className={clsx(classes.rightTopElement, classes.floatingContainer)}>
                    {topRightElement(id)}
                </View>
            )}

            {hasLabelSelector && (
                <CondensedLabelSelector
                    title={'Unlabeled'}
                    labelIds={labelIds}
                    right={'size-50'}
                    bottom={'size-50'}
                    viewMode={viewMode}
                    position={'absolute'}
                    isDisabled={isEmpty(taskLabels)}
                    triggerState={labelSelectorState}
                    onSelectLabel={onSelectLabel}
                />
            )}
            <MediaItemContextMenu containerRef={unwrappedContainerRef} options={contextMenuOptions} />
        </View>
    );
};
