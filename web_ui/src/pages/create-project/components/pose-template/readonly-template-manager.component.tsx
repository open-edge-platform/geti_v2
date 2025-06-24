// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useRef, useState } from 'react';

import { Flex } from '@geti/ui';
import { noop } from 'lodash-es';

import { HoveredProvider } from '../../../../providers/hovered-provider/hovered-provider.component';
import { SelectedProvider } from '../../../../providers/selected-provider/selected-provider.component';
import { denormalizePoint } from '../../../../shared/utils';
import useUndoRedoState from '../../../annotator/tools/undo-redo/use-undo-redo-state';
import { ZoomProvider } from '../../../annotator/zoom/zoom-provider.component';
import { TransformZoom } from '../../../shared/zoom/transform-zoom.component';
import { TemplateState } from '../../../utils';
import { CanvasTemplate } from './canvas/canvas-template.component';
import { createRoi, resizePoints } from './util';

export interface ReadonlyTemplateManagerProps {
    className: string;
    scaleFactor?: number;
    initialNormalizedState: TemplateState;
}

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
        const denormalizePoints = initialNormalizedState.points.map((point) => denormalizePoint(point, newRoi));

        setRoi(newRoi);

        undoRedoActions.reset({
            ...initialNormalizedState,
            points: resizePoints(scaleFactor, newRoi, denormalizePoints),
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
