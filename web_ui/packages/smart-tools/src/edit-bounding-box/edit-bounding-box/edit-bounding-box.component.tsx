// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useState } from 'react';

import { Annotation, Point, RegionOfInterest } from '../../shared/interfaces';
import { getBoundingBoxInRoi, getBoundingBoxResizePoints, getClampedBoundingBox } from '../../utils/tool-utils';
import { ANCHOR_SIZE, ResizeAnchor } from '../resize-anchor.component';
import { TranslateShape } from '../translate-shape.component';

import classes from './edit-bounding-box.module.scss';

interface EditBoundingBoxProps {
    annotation: Annotation & { shape: { shapeType: 'rect' } };
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
}: EditBoundingBoxProps): JSX.Element => {
    const [shape, setShape] = useState(annotation.shape);

    const ariaLabel = `${annotation.isSelected ? 'Selected' : 'Not selected'} shape ${annotation.id}`;

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
                >
                    <g
                        id={`canvas-annotation-${annotation.id}`}
                        fill={annotation.color || '#0095ca'}
                        fillOpacity='var(--annotation-fill-opacity, 0.2)'
                        stroke={annotation.color || '#0095ca'}
                        strokeWidth={2 / zoom}
                        strokeOpacity='var(--annotation-border-opacity, 0.8)'
                        strokeLinecap='round'
                        strokeDasharray='0'
                        strokeDashoffset='0'
                    >
                        <rect
                            x={shape.x}
                            y={shape.y}
                            width={shape.width}
                            height={shape.height}
                            aria-label={ariaLabel}
                        />
                    </g>
                </TranslateShape>
            </svg>

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
