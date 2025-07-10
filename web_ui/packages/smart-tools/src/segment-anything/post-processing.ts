// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { OpenCVTypes } from '../opencv/interfaces';
import { Circle, Point, Polygon, Rect, RotatedRect, Shape, ShapeType } from '../shared/interfaces';
import { approximateShape } from '../utils/tool-utils';
import { type SegmentAnythingResult } from './interfaces';

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
        const width = sizes.width;
        const height = sizes.height;
        const mat = this.CV.matFromArray(height, width, this.CV.CV_8U, pixels);

        const contours = new this.CV.MatVector();
        const hierachy: OpenCVTypes.Mat = new this.CV.Mat();

        this.CV.findContours(mat, contours, hierachy, this.CV.RETR_EXTERNAL, this.CV.CHAIN_APPROX_NONE);

        let maxContourIdx = 0;
        let maxArea = -1;

        const shapes: Shape[] = [];
        const areas: number[] = [];
        const imageArea = sizes.originalWidth * sizes.originalHeight;
        for (let idx = 0; idx < Number(contours.size()); idx++) {
            const contour = contours.get(idx);
            const optimizedContour = approximateShape(this.CV, contour);
            const area = this.CV.contourArea(optimizedContour, false);

            const shape = this.contourToShape(optimizedContour, config, scales);

            // Get rid of results that might take up the whole image
            const boundingBox = this.contourToRectangle(optimizedContour, scales);
            if ((boundingBox.width * boundingBox.height) / imageArea < 0.9) {
                if (config.shapeFilter === undefined || config.shapeFilter(shape)) {
                    shapes.push(shape);
                    areas.push(area);
                    if (area > maxArea) {
                        maxArea = area;
                        maxContourIdx = shapes.length - 1;
                    }
                }
            }

            optimizedContour?.delete();
            contour?.delete();
        }

        contours.delete();
        hierachy.delete();
        mat.delete();

        // TODO: filter contours based on size (i.e. larger than x%, smaller than 90% of image)
        // TODO: give some kind of score based on area and if the points are
        // (not) included in the contour

        return { areas, maxContourIdx, shapes };
    }

    private contourToShape = (
        optimizedContour: OpenCVTypes.Mat,
        config: PostProcessorConfig,
        scales: ScaleToSize
    ): Shape => {
        switch (config.type) {
            case 'polygon':
                return this.contourToPolygon(optimizedContour, scales);
            case 'rect':
                return this.contourToRectangle(optimizedContour, scales);
            case 'rotated-rect':
                return this.contourToRotatedRectangle(optimizedContour, scales);
            case 'circle':
                return this.contourToCircle(optimizedContour, scales);
            default:
                throw new Error('Can not create keypoint using SAM');
        }
    };

    private contourToPolygon(optimizedContour: OpenCVTypes.Mat, { scaleX, scaleY }: ScaleToSize): Polygon {
        const points: Point[] = [];

        for (let row = 0; row < optimizedContour.rows; row++) {
            const x = scaleX(optimizedContour.intAt(row, 0));
            const y = scaleY(optimizedContour.intAt(row, 1));

            points.push({ x, y });
        }

        return { shapeType: 'polygon', points };
    }

    private contourToRectangle(optimizedContour: OpenCVTypes.Mat, { scaleX, scaleY }: ScaleToSize): Rect {
        const { x, y, width, height } = this.CV.boundingRect(optimizedContour);

        return {
            shapeType: 'rect',
            x: scaleX(x),
            y: scaleY(y),
            width: scaleX(width),
            height: scaleY(height),
        };
    }

    private contourToRotatedRectangle(optimizedContour: OpenCVTypes.Mat, { scaleX, scaleY }: ScaleToSize): RotatedRect {
        const {
            angle,
            center: { x, y },
            size: { width, height },
        } = this.CV.minAreaRect(optimizedContour);

        return {
            shapeType: 'rotated-rect',
            x: scaleX(x),
            y: scaleY(y),
            width: scaleX(width),
            height: scaleY(height),
            angle,
        };
    }

    private contourToCircle(optimizedContour: OpenCVTypes.Mat, { scaleX, scaleY }: ScaleToSize): Circle {
        const {
            center: { x, y },
            size: { width, height },
        } = this.CV.minAreaRect(optimizedContour);

        return {
            shapeType: 'circle',
            x: scaleX(x),
            y: scaleY(y),
            r: Math.round(Math.max(scaleX(width), scaleY(height))),
        };
    }

    private scaleToOriginalSize(sizes: Sizes): ScaleToSize {
        const { width, height, originalWidth, originalHeight } = sizes;

        return {
            scaleX: (x: number) => Math.round((x * originalWidth) / width),
            scaleY: (y: number) => Math.round((y * originalHeight) / height),
        };
    }
}
