// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { rectToRotatedRect } from '@geti/smart-tools/utils';
import { partial } from 'lodash-es';

import { Rect } from '../../../../core/annotations/shapes.interface';
import { DOMAIN } from '../../../../core/projects/core.interface';
import { runWhen } from '../../../../shared/utils';
import { useROI } from '../../providers/region-of-interest-provider/region-of-interest-provider.component';
import { useTask } from '../../providers/task-provider/task-provider.component';
import { useZoom } from '../../zoom/zoom-provider.component';
import { DrawingBox } from '../drawing-box/drawing-box.component';
import { ToolAnnotationContextProps } from '../tools.interface';
import { convertToolShapeToGetiShape, drawingStyles, isShapeWithinRoi } from '../utils';

export const BoundingBoxTool = ({ annotationToolContext }: ToolAnnotationContextProps) => {
    const { scene } = annotationToolContext;
    const { roi, image } = useROI();
    const { defaultLabel, activeDomains } = useTask();
    const isValidRect = partial(isShapeWithinRoi, roi);

    const onComplete = runWhen<Rect>(isValidRect)((shape: Rect) => {
        const isRotatedBoundingBox = activeDomains.includes(DOMAIN.DETECTION_ROTATED_BOUNDING_BOX);
        const rect = isRotatedBoundingBox ? rectToRotatedRect(shape) : shape;
        scene.addShapes([convertToolShapeToGetiShape(rect)]);
    });

    const {
        zoomState: { zoom },
    } = useZoom();

    const styles = drawingStyles(defaultLabel);

    return <DrawingBox onComplete={onComplete} image={image} zoom={zoom} styles={styles} />;
};
