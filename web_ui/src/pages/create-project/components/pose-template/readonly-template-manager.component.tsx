// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useRef, useState } from 'react';

import { Flex } from '@geti/ui';
import { noop } from 'lodash-es';

import { KeypointNode } from '../../../../core/annotations/shapes.interface';
import { HoveredProvider } from '../../../../providers/hovered-provider/hovered-provider.component';
import { SelectedProvider } from '../../../../providers/selected-provider/selected-provider.component';
import { denormalizePoint } from '../../../../shared/utils';
import useUndoRedoState from '../../../annotator/tools/undo-redo/use-undo-redo-state';
import { ZoomProvider } from '../../../annotator/zoom/zoom-provider.component';
import { TransformZoom } from '../../../shared/zoom/transform-zoom.component';
import { getMaxMinPoint, PointAxis } from '../../../utils';
import { CanvasTemplate } from './canvas/canvas-template.component';
import { createRoi, TemplateState } from './util';

export interface ReadonlyTemplateManagerProps {
    className: string;
    scaleFactor?: number;
    initialNormalizedState: TemplateState;
}

const repositionPoints = (scaleFactor: number, points: KeypointNode[]) => {
    const [minX, maxX] = getMaxMinPoint(points, PointAxis.X);
    const [minY, maxY] = getMaxMinPoint(points, PointAxis.Y);

    const currentWidth = maxX - minX;
    const currentHeight = maxY - minY;

    const newWidth = currentWidth * scaleFactor;
    const newHeight = currentHeight * scaleFactor;

    const scaleX = newWidth / currentWidth;
    const scaleY = newHeight / currentHeight;

    const paddingY = (currentHeight - newHeight) / 2;
    const paddingX = (currentWidth - newWidth) / 2;

    const newPoints = points.map((point) => ({
        ...point,
        x: (point.x - minX) * scaleX + minX + paddingX,
        y: (point.y - minY) * scaleY + minY + paddingY,
    }));

    return newPoints;
};

export const ReadonlyTemplateManager = ({
    className,
    scaleFactor = 0.8,
    initialNormalizedState,
}: ReadonlyTemplateManagerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [roi, setRoi] = useState(createRoi());

    const [state, _setState, undoRedoActions] = useUndoRedoState(initialNormalizedState);

    useEffect(() => {
        const newRoi = createRoi(containerRef.current?.clientWidth, containerRef.current?.clientHeight);

        setRoi(newRoi);

        undoRedoActions.reset({
            ...initialNormalizedState,
            points: repositionPoints(
                scaleFactor,
                initialNormalizedState.points.map((point) => denormalizePoint(point, newRoi))
            ),
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <ZoomProvider>
            <SelectedProvider>
                <HoveredProvider>
                    <Flex direction={'column'} height={'100%'} UNSAFE_className={className}>
                        <TransformZoom>
                            <div
                                aria-label='keypoint readonly template'
                                ref={containerRef}
                                onContextMenu={(event) => event.preventDefault()}
                                style={{ width: '100%', overflow: 'hidden', gridArea: 'content' }}
                            >
                                <CanvasTemplate
                                    roi={roi}
                                    state={state}
                                    onStateUpdate={noop}
                                    isAddPointEnabled={false}
                                    isLabelOptionsEnabled={false}
                                />
                            </div>
                        </TransformZoom>
                    </Flex>
                </HoveredProvider>
            </SelectedProvider>
        </ZoomProvider>
    );
};
