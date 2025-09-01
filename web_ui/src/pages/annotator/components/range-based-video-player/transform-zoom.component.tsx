// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { CSSProperties, FC, PropsWithChildren, useEffect } from 'react';

import { TransformComponent } from 'react-zoom-pan-pinch';

import { MediaItem } from '../../../../core/media/media.interface';
import { useSyncScreenSize } from '../../zoom/use-sync-screen-size.hook';
import { useZoom, useZoomState } from '../../zoom/zoom-provider.component';

import zoomClasses from '../../zoom/transform-zoom-annotation.module.scss';

export const TransformZoom: FC<PropsWithChildren<{ mediaItem: MediaItem }>> = ({ children, mediaItem }) => {
    const ref = useSyncScreenSize();
    const { isPanning, isPanningDisabled, setZoomTarget } = useZoom();
    const zoomState = useZoomState();

    const style = { '--zoom-level': zoomState.zoom } as CSSProperties;
    const enableDragCursorIcon = !isPanningDisabled && isPanning;

    useEffect(() => {
        const width = mediaItem.metadata.width;
        const height = mediaItem.metadata.height;

        setZoomTarget({ x: 0, y: 0, width, height });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            id='canvas'
            data-testid='transform-zoom-canvas'
            style={style}
            ref={ref}
            className={`${zoomClasses.canvasComponent} ${enableDragCursorIcon ? zoomClasses.isPanning : ''}`}
        >
            <TransformComponent wrapperClass={zoomClasses.transformWrapper} contentClass={zoomClasses.transformContent}>
                {children}
            </TransformComponent>
        </div>
    );
};
