// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import type { OpenCVTypes } from '../opencv/interfaces';
import { Circle, Point, Polygon, Rect, RotatedRect, Shape, ShapeType } from '../shared/interfaces';
import { approximateShape } from '../utils/tool-utils';
import { type SegmentAnythingResult } from './interfaces';

// Discard contours whose bounding box covers more than this fraction of the
// image — SAM occasionally returns a single mask that's basically the whole
// frame and is never what the user wanted.
const MAX_CONTOUR_AREA_RATIO = 0.9;

interface PostProcessorConfig {
    type: ShapeType;
    shapeFilter?: (shape: Shape) => boolean;
}

type Sizes = {
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
};

type ScaleToSize = {
    scaleX: (x: number) => number;
    scaleY: (x: number) => number;
};

export class PostProcessor {
    constructor(private CV: OpenCVTypes.cv) {}

    public maskToAnnotationShape(
        pixels: Uint8ClampedArray,
        sizes: Sizes,
        config: PostProcessorConfig
    ): SegmentAnythingResult {
        const scales = this.scaleToOriginalSize(sizes);
        const mat = this.CV.matFromArray(sizes.height, sizes.width, this.CV.CV_8U, pixels);
        const contours = new this.CV.MatVector();
        const hierarchy: OpenCVTypes.Mat = new this.CV.Mat();

        const shapes: Shape[] = [];
        const areas: number[] = [];
        const imageArea = sizes.originalWidth * sizes.originalHeight;
        let maxContourIdx = 0;
        let maxArea = -1;

        try {
            this.CV.findContours(mat, contours, hierarchy, this.CV.RETR_EXTERNAL, this.CV.CHAIN_APPROX_NONE);

            for (let idx = 0; idx < Number(contours.size()); idx++) {
                const contour = contours.get(idx);
                const optimized = approximateShape(this.CV, contour);
                try {
                    const bbox = this.contourToRectangle(optimized, scales);
                    if ((bbox.width * bbox.height) / imageArea >= MAX_CONTOUR_AREA_RATIO) continue;

                    const shape = this.contourToShape(optimized, config, scales);
                    if (config.shapeFilter && !config.shapeFilter(shape)) continue;

                    const area = this.CV.contourArea(optimized, false);
                    shapes.push(shape);
                    areas.push(area);
                    if (area > maxArea) {
                        maxArea = area;
                        maxContourIdx = shapes.length - 1;
                    }
                } finally {
                    optimized?.delete();
                    contour?.delete();
                }
            }
        } finally {
            contours.delete();
            hierarchy.delete();
            mat.delete();
        }

        return { areas, maxContourIdx, shapes };
    }

    private contourToShape(contour: OpenCVTypes.Mat, config: PostProcessorConfig, scales: ScaleToSize): Shape {
        switch (config.type) {
            case 'polygon':
                return this.contourToPolygon(contour, scales);
            case 'rect':
                return this.contourToRectangle(contour, scales);
            case 'rotated-rect':
                return this.contourToRotatedRectangle(contour, scales);
            case 'circle':
                return this.contourToCircle(contour, scales);
            default:
                throw new Error('Can not create keypoint using SAM');
        }
    }

    private contourToPolygon(contour: OpenCVTypes.Mat, { scaleX, scaleY }: ScaleToSize): Polygon {
        const points: Point[] = [];
        for (let row = 0; row < contour.rows; row++) {
            points.push({ x: scaleX(contour.intAt(row, 0)), y: scaleY(contour.intAt(row, 1)) });
        }
        return { shapeType: 'polygon', points };
    }

    private contourToRectangle(contour: OpenCVTypes.Mat, { scaleX, scaleY }: ScaleToSize): Rect {
        const { x, y, width, height } = this.CV.boundingRect(contour);
        return {
            shapeType: 'rect',
            x: scaleX(x),
            y: scaleY(y),
            width: scaleX(width),
            height: scaleY(height),
        };
    }

    private contourToRotatedRectangle(contour: OpenCVTypes.Mat, { scaleX, scaleY }: ScaleToSize): RotatedRect {
        const {
            angle,
            center: { x, y },
            size: { width, height },
        } = this.CV.minAreaRect(contour);
        return {
            shapeType: 'rotated-rect',
            x: scaleX(x),
            y: scaleY(y),
            width: scaleX(width),
            height: scaleY(height),
            angle,
        };
    }

    private contourToCircle(contour: OpenCVTypes.Mat, { scaleX, scaleY }: ScaleToSize): Circle {
        const {
            center: { x, y },
            size: { width, height },
        } = this.CV.minAreaRect(contour);
        return {
            shapeType: 'circle',
            x: scaleX(x),
            y: scaleY(y),
            r: Math.round(Math.max(scaleX(width), scaleY(height))),
        };
    }

    private scaleToOriginalSize({ width, height, originalWidth, originalHeight }: Sizes): ScaleToSize {
        return {
            scaleX: (x) => Math.round((x * originalWidth) / width),
            scaleY: (y) => Math.round((y * originalHeight) / height),
        };
    }
}
