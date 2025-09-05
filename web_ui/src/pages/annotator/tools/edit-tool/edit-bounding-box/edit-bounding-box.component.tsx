// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useState } from 'react';

import { ANCHOR_SIZE, ResizeAnchor } from '@geti/smart-tools';
import { RegionOfInterest } from '@geti/smart-tools/types';

import { Annotation } from '../../../../../core/annotations/annotation.interface';
import { Point } from '../../../../../core/annotations/shapes.interface';
import { ShapeType } from '../../../../../core/annotations/shapetype.enum';
import { Labels } from '../../../annotation/labels/labels.component';
import { TranslateShape } from '../translate-shape.component';
import { getBoundingBoxInRoi, getBoundingBoxResizePoints, getClampedBoundingBox } from '../utils';

import classes from './../../../annotator-canvas.module.scss';

interface EditBoundingBoxProps {
    annotation: Annotation & { shape: { shapeType: ShapeType.Rect } };
    disableTranslation?: boolean;
    disablePoints?: boolean;
    roi: RegionOfInterest;
    image: ImageData;
    zoom: number;
    updateAnnotation: (annotation: Annotation) => void;
}

export const EditBoundingBox = ({
    annotation,
    disablePoints = false,
    disableTranslation = false,
    roi,
    image,
    zoom,
    updateAnnotation,
}: EditBoundingBoxProps) => {
    const [shape, setShape] = useState(annotation.shape);

    useEffect(() => setShape(annotation.shape), [annotation.shape]);

    const onComplete = () => {
        updateAnnotation({ ...annotation, shape });
    };

    const translate = (point: Point) => {
        const newBoundingBox = getClampedBoundingBox(point, shape, roi);

        setShape({ ...shape, ...newBoundingBox });
    };

    const anchorPoints = getBoundingBoxResizePoints({
        gap: (2 * ANCHOR_SIZE) / zoom,
        boundingBox: shape,
        onResized: (boundingBox) => {
            setShape({ ...shape, ...getBoundingBoxInRoi(boundingBox, roi) });
        },
    });

    return (
        <>
            <svg
                width={image.width}
                height={image.height}
                className={classes.disabledLayer}
                id={`translate-bounding-box-${annotation.id}`}
            >
                <TranslateShape
                    disabled={disableTranslation}
                    zoom={zoom}
                    annotation={{ ...annotation, shape }}
                    translateShape={translate}
                    onComplete={onComplete}
                />
            </svg>

            <Labels annotation={{ ...annotation, shape }} />

            {disablePoints === false ? (
                <svg
                    width={image.width}
                    height={image.height}
                    className={classes.disabledLayer}
                    aria-label={`Edit bounding box points ${annotation.id}`}
                    id={`edit-bounding-box-points-${annotation.id}`}
                >
                    <g style={{ pointerEvents: 'auto' }}>
                        {anchorPoints.map((anchor) => {
                            return <ResizeAnchor key={anchor.label} zoom={zoom} onComplete={onComplete} {...anchor} />;
                        })}
                    </g>
                </svg>
            ) : (
                <></>
            )}
        </>
    );
};
