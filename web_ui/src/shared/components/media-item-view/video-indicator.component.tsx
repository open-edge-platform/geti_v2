// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { View } from '@geti/ui';

import { useDurationText } from '../../hooks/data-format/use-duration-text.hook';
import { useFramesText } from '../../hooks/data-format/use-frames-text.hook';

import classes from './video-indicator.module.scss';

interface VideoIndicatorProps {
    duration: number;
    frames: number | undefined;
}

export const VideoIndicator = ({ duration, frames }: VideoIndicatorProps): JSX.Element => {
    const shouldShowFramesIndicator = frames !== undefined;
    const durationText = useDurationText(duration);
    const frameText = useFramesText(frames ?? 0);

    return (
        <>
            {shouldShowFramesIndicator && (
                <View
                    id={'video-indicator-frames-id'}
                    data-testid={'video-indicator-frames-id'}
                    right={'size-50'}
                    top={'size-50'}
                    zIndex={1}
                    padding={'size-50'}
                    position={'absolute'}
                    borderRadius={'small'}
                    height={'size-200'}
                    UNSAFE_className={classes.videoFrameText}
                >
                    {frameText}
                </View>
            )}
            <View
                id={'video-indicator-duration-id'}
                data-testid={'video-indicator-duration-id'}
                left={'size-50'}
                bottom={'size-50'}
                zIndex={1}
                padding={'size-50'}
                position={'absolute'}
                borderRadius={'small'}
                height={'size-200'}
                UNSAFE_className={classes.videoFrameText}
            >
                {durationText}
            </View>
        </>
    );
};
