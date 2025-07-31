// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode, useEffect, useRef, useState } from 'react';

import { Loading, useUnwrapDOMRef, View, type DimensionValue, type Responsive } from '@geti/ui';
import { useOverlayTriggerState } from '@react-stately/overlays';
import clsx from 'clsx';
import { isEmpty, isFunction, isNil } from 'lodash-es';
import { usePress } from 'react-aria';

import { Label } from '../../../core/labels/label.interface';
import { useTask } from '../../../pages/annotator/providers/task-provider/task-provider.component';
import { getSingleValidTask } from '../../../pages/camera-page/util';
import { isVideoFile, loadImageFromFile, loadVideoFromFile } from '../../media-utils';
import { ViewModes } from '../media-view-modes/utils';
import { CondensedLabelSelector } from './condensed-label-selector.component';
import { ImageVideoFactory } from './image-video-factory.component';
import { MediaItemContextMenu } from './media-item-context-menu.component';

import classes from './media-item.module.scss';

export interface MediaItemProps {
    id: string;
    url: string | null | undefined;
    labelIds: string[];
    mediaFile: File;
    isSelected: boolean;
    height?: Responsive<DimensionValue>;
    viewMode?: ViewModes;
    hasLabelSelector: boolean;
    onPress?: (id: string) => void;
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
    isSelected,
    hasLabelSelector,
    onPress,
    onSelectLabel,
    topLeftElement,
    topRightElement,
}: MediaItemProps): JSX.Element => {
    const { tasks } = useTask();
    const containerRef = useRef(null);
    const [url, setUrl] = useState(initUrl);

    const alertDialogState = useOverlayTriggerState({});
    const labelSelectorState = useOverlayTriggerState({});
    const unwrappedContainerRef = useUnwrapDOMRef(containerRef);
    const { pressProps } = usePress({ onPress: () => isFunction(onPress) && onPress(id) });

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
        <View
            ref={containerRef}
            UNSAFE_className={clsx({ [classes.container]: true, [classes.selected]: isSelected })}
            height={height}
        >
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
                {...pressProps}
            />

            {isFunction(topLeftElement) && (
                <View
                    UNSAFE_className={clsx({
                        [classes.visible]: isSelected,
                        [classes.leftTopElement]: true,
                        [classes.floatingContainer]: true,
                    })}
                >
                    {topLeftElement(id)}
                </View>
            )}

            {isFunction(topRightElement) && (
                <View
                    UNSAFE_className={clsx({
                        [classes.visible]: isSelected,
                        [classes.rightTopElement]: true,
                        [classes.floatingContainer]: true,
                    })}
                >
                    {topRightElement(id)}
                </View>
            )}

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
