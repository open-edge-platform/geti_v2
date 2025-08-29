// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode, useState } from 'react';

import { Flex, Skeleton, Text, View } from '@geti/ui';
import { AlertCircle } from '@geti/ui/icons';
import { useSpinDelay } from 'spin-delay';

import { getAnnotationStateForTask } from '../../../core/annotations/utils';
import { MEDIA_PREPROCESSING_STATUS } from '../../../core/media/base.interface';
import { isImage } from '../../../core/media/image.interface';
import { MediaItem } from '../../../core/media/media.interface';
import { isMediaPreprocessing } from '../../../core/media/utils/preprocessing.utils';
import { isVideo, isVideoFrame } from '../../../core/media/video.interface';
import { AnnotationStateIndicator } from '../annotation-indicator/annotation-state-indicator.component';
import { VideoAnnotationIndicator } from '../annotation-indicator/video-annotation-indicator.component';
import { VideoFrameNumberIndicator } from './video-frame-number-indicator.component';
import { VideoIndicator } from './video-indicator.component';

import classes from '../../shared.module.scss';

interface MediaItemViewProps {
    mediaItem: MediaItem;
    itemMenu?: ReactNode;
    shouldShowAnnotationIndicator: boolean;
    shouldShowVideoIndicator?: boolean;
}

export const MediaItemView = ({
    itemMenu,
    mediaItem,
    shouldShowAnnotationIndicator,
    shouldShowVideoIndicator = true,
}: MediaItemViewProps) => {
    const [isImageLoaded, setImageLoaded] = useState<boolean>(false);
    const [thumbnailError, setThumbnailError] = useState<boolean>(false);

    const { name, thumbnailSrc, annotationStatePerTask, preprocessingStatus } = mediaItem;
    const resolution = `(${mediaItem.metadata.width}x${mediaItem.metadata.height})`;

    const isPreprocessingFailed = preprocessingStatus === MEDIA_PREPROCESSING_STATUS.FAILED;
    const isPreprocessingFinished = preprocessingStatus === MEDIA_PREPROCESSING_STATUS.FINISHED;

    const shouldShowSkeleton =
        isMediaPreprocessing(preprocessingStatus) || (!isImageLoaded && !thumbnailError && isPreprocessingFinished);
    const showLoadingSpinner = useSpinDelay(shouldShowSkeleton, { delay: 100 });

    return (
        <View
            position={'relative'}
            height={'100%'}
            width={'100%'}
            overflow={'hidden'}
            UNSAFE_className={classes.scaling}
        >
            {!showLoadingSpinner && itemMenu}

            {showLoadingSpinner && (
                <Skeleton isAspectRatioOne id={'image-placeholder-id'} data-testid={'image-placeholder-id'} />
            )}

            {isPreprocessingFinished && !thumbnailError && (
                <img
                    key={thumbnailSrc}
                    width={'100%'}
                    height={'100%'}
                    alt={name}
                    data-testid={`${name}${resolution}`}
                    src={thumbnailSrc}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setThumbnailError(true)}
                    style={{
                        display: showLoadingSpinner ? 'none' : 'block',
                    }}
                    // @ts-expect-error fetchPriority isn't recognized by react yet
                    // eslint-disable-next-line react/no-unknown-property
                    fetchpriority='low'
                />
            )}

            {(isPreprocessingFailed || (thumbnailError && isPreprocessingFinished)) && (
                <View
                    width={'100%'}
                    height={'100%'}
                    backgroundColor={'gray-50'}
                    borderRadius={'medium'}
                    data-testid={isPreprocessingFailed ? 'processing-error-container' : 'broken-image-container'}
                    UNSAFE_style={{ aspectRatio: '1' }}
                >
                    <Flex
                        alignItems='center'
                        justifyContent='center'
                        direction='column'
                        gap='size-100'
                        height='100%'
                        width='100%'
                    >
                        <AlertCircle size='L' aria-label={'Failed to load thumbnail'} />
                        <Text
                            UNSAFE_style={{
                                fontSize: 'var(--spectrum-global-dimension-font-size-100)',
                                color: 'var(--spectrum-global-color-gray-600)',
                                textAlign: 'center',
                            }}
                        >
                            Failed to load thumbnail
                        </Text>
                    </Flex>
                </View>
            )}

            {shouldShowAnnotationIndicator && isImage(mediaItem) && (
                <AnnotationStateIndicator
                    state={getAnnotationStateForTask(annotationStatePerTask)}
                    id={mediaItem.name}
                />
            )}

            {shouldShowAnnotationIndicator && isVideo(mediaItem) && <VideoAnnotationIndicator video={mediaItem} />}

            {shouldShowVideoIndicator && isVideo(mediaItem) && (
                <VideoIndicator duration={mediaItem.metadata.duration} frames={mediaItem.matchedFrames} />
            )}

            {isVideoFrame(mediaItem) && shouldShowVideoIndicator && (
                <VideoFrameNumberIndicator frameNumber={mediaItem.identifier.frameNumber} />
            )}
        </View>
    );
};
