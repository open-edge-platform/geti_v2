// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { View } from '@geti/ui';

import classes from './video-indicator.module.scss';

interface VideoFrameIndicatorProps {
    frameNumber: number;
}

export const VideoFrameNumberIndicator = ({ frameNumber }: VideoFrameIndicatorProps) => {
    return (
        <View
            id={'video-frame-indicator-id'}
            data-testid={'video-frame-indicator-id'}
            top={'size-50'}
            right={'size-50'}
            zIndex={1}
            padding={'size-50'}
            position={'absolute'}
            borderRadius={'small'}
            height={'size-200'}
            UNSAFE_className={classes.videoFrameText}
        >
            {frameNumber}F
        </View>
    );
};
