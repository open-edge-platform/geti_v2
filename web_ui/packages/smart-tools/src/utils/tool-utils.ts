// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import Clipper from '@doodle3d/clipper-js';

import { OpenCVTypes } from '../opencv/interfaces';
import { Point, Polygon, RegionOfInterest } from '../shared/interfaces';
import { BoundingBox, clampBetween } from './math';

export const formatContourToPoints = (
    mask: OpenCVTypes.Mat,
    contour: OpenCVTypes.Mat,
    width: number,
    height: number
): Point[] => {
    const points: Point[] = [];

    if (!contour?.rows) {
        return points;
    }

    for (let row = 0; row < contour.rows; row++) {
        points.push({
            x: (contour.intAt(row, 0) / mask.cols) * width,
            y: (contour.intAt(row, 1) / mask.rows) * height,
        });
    }

    return points;
};

const POLYGON_VALID_AREA = 4;
const convertPolygonPoints = (
    shape: Polygon
): {
    X: number;
    Y: number;
}[] => {
    return shape.points.map(({ x, y }: Point) => ({ X: x, Y: y }));
};
export const isPolygonValid = (polygon: Polygon | null): boolean => {
    if (!polygon) return false;

    const sPolygon = new Clipper([convertPolygonPoints(polygon)], true);

    return Math.abs(sPolygon.totalArea()) > POLYGON_VALID_AREA;
};

// It approximates a contour shape to another shape with less number of vertices
export const approximateShape = (CV: OpenCVTypes.cv, contour: OpenCVTypes.Mat, isClose = true): OpenCVTypes.Mat => {
    const epsilon = 1.0;
    const newContour = new CV.Mat();

    CV.approxPolyDP(contour, newContour, epsilon, isClose);

    return newContour;
};

export const formatImageData = (CV: OpenCVTypes.cv, mat: OpenCVTypes.Mat): ImageData => {
    const img = new CV.Mat();
    const depth = mat.type() % 8;
    const scale = depth <= CV.CV_8S ? 1 : depth <= CV.CV_32S ? 1 / 256 : 255;
    const shift = depth === CV.CV_8S || depth === CV.CV_16S ? 128 : 0;

    mat.convertTo(img, CV.CV_8U, scale, shift);

    switch (img.type()) {
        case CV.CV_8UC1:
            CV.cvtColor(img, img, CV.COLOR_GRAY2RGBA);
            break;
        case CV.CV_8UC3:
            CV.cvtColor(img, img, CV.COLOR_RGB2RGBA);
            break;
        case CV.CV_8UC4:
            break;
        default:
            throw new Error('Bad number of channels (Source image must have 1, 3 or 4 channels)');
    }

    return new ImageData(new Uint8ClampedArray(img.data), img.cols, img.rows);
};

export const concatFloat32Arrays = (arrays: Float32Array[]) => {
    const totalLength = arrays.reduce((c, a) => c + a.length, 0);
    const result = new Float32Array(totalLength);

    arrays.reduce((offset, array) => {
        result.set(array, offset);
        return offset + array.length;
    }, 0);

    return result;
};

export const stackPlanes = (CV: OpenCVTypes.cv, mat: OpenCVTypes.Mat) => {
    let stackedPlanes: OpenCVTypes.Mat[] = [];
    let matPlanes: OpenCVTypes.MatVector | null = null;

    try {
        matPlanes = new CV.MatVector();
        CV.split(mat, matPlanes);

        stackedPlanes = Array.from(Array(mat.channels()).keys()).map((index) => {
            // This won't happen, but matPlanes is mutable for the finally block.
            if (!matPlanes) {
                throw 'Lost track of matPlanes through loop';
            }

            return matPlanes.get(index);
        });

        return concatFloat32Arrays(stackedPlanes.map((m) => m.data32F));
    } finally {
        stackedPlanes.map((p) => p.delete());
        matPlanes?.delete();
    }
};

export const loadSource = async (source: string, cacheKey = 'general'): Promise<Response | undefined> => {
    if (!caches) {
        return await self.fetch(source);
    }

    const cache = await caches.open(cacheKey);

    if (!(await cache.match(source))) {
        await cache.put(source, await self.fetch(source));
    }

    return cache.match(source);
};

export const getPointsFromMat = (mat: OpenCVTypes.Mat, offset = { x: 0, y: 0 }): Point[] => {
    const points: Point[] = [];

    for (let row = 0; row < mat.rows; row++) {
        points.push({
            x: Math.round(mat.intAt(row, 0) + offset.x),
            y: Math.round(mat.intAt(row, 1) + offset.y),
        });
    }
    return points;
};

export const getMatFromPoints = (CV: OpenCVTypes.cv, points: Point[], offset = { x: 0, y: 0 }): OpenCVTypes.Mat => {
    const pointsMat = new CV.Mat(points.length, 1, CV.CV_32SC2);

    points.forEach(({ x, y }, idx) => {
        pointsMat.intPtr(idx, 0)[0] = x + offset.x;
        pointsMat.intPtr(idx, 0)[1] = y + offset.y;
    });

    return pointsMat;
};

interface getBoundingBoxResizePointsProps {
    gap: number;
    boundingBox: BoundingBox;
    onResized: (boundingBox: BoundingBox) => void;
}

export const getClampedBoundingBox = (point: Point, boundingBox: RegionOfInterest, roi: RegionOfInterest) => {
    const roiX = roi.width + roi.x;
    const roiY = roi.height + roi.y;
    const shapeX = boundingBox.width + boundingBox.x;
    const shapeY = boundingBox.height + boundingBox.y;

    const clampedTranslate = {
        x: clampBetween(shapeX - roiX, -point.x, boundingBox.x - roi.x),
        y: clampBetween(shapeY - roiY, -point.y, boundingBox.y - roi.y),
    };

    return {
        ...boundingBox,
        x: boundingBox.x - clampedTranslate.x,
        y: boundingBox.y - clampedTranslate.y,
    };
};

export const getBoundingBoxInRoi = (boundingBox: BoundingBox, roi: RegionOfInterest) => {
    const x = Math.max(0, boundingBox.x);
    const y = Math.max(0, boundingBox.y);

    return {
        x,
        y,
        width: Math.min(roi.width - x, boundingBox.width),
        height: Math.min(roi.height - y, boundingBox.height),
    };
};

// Keep a gap between anchor points so that they don't overlap
export const getBoundingBoxResizePoints = ({ boundingBox, gap, onResized }: getBoundingBoxResizePointsProps) => {
    return [
        {
            x: boundingBox.x,
            y: boundingBox.y,
            moveAnchorTo: (x: number, y: number) => {
                const x1 = Math.max(0, Math.min(x, boundingBox.x + boundingBox.width - gap));
                const y1 = Math.max(0, Math.min(y, boundingBox.y + boundingBox.height - gap));

                onResized({
                    x: x1,
                    width: Math.max(gap, boundingBox.width + boundingBox.x - x1),
                    y: y1,
                    height: Math.max(gap, boundingBox.height + boundingBox.y - y1),
                });
            },
            cursor: 'nw-resize',
            label: 'North west resize anchor',
        },
        {
            x: boundingBox.x + boundingBox.width / 2,
            y: boundingBox.y,
            moveAnchorTo: (_x: number, y: number) => {
                const y1 = Math.max(0, Math.min(y, boundingBox.y + boundingBox.height - gap));

                onResized({
                    ...boundingBox,
                    y: y1,
                    height: Math.max(gap, boundingBox.height + boundingBox.y - y1),
                });
            },
            cursor: 'n-resize',
            label: 'North resize anchor',
        },
        {
            x: boundingBox.x + boundingBox.width,
            y: boundingBox.y,
            moveAnchorTo: (x: number, y: number) => {
                const y1 = Math.max(0, Math.min(y, boundingBox.y + boundingBox.height - gap));

                onResized({
                    ...boundingBox,
                    width: Math.max(gap, x - boundingBox.x),
                    y: y1,
                    height: Math.max(gap, boundingBox.height + boundingBox.y - y1),
                });
            },
            cursor: 'ne-resize',
            label: 'North east resize anchor',
        },
        {
            x: boundingBox.x + boundingBox.width,
            y: boundingBox.y + boundingBox.height / 2,
            moveAnchorTo: (x: number) => {
                onResized({ ...boundingBox, width: Math.max(gap, x - boundingBox.x) });
            },
            cursor: 'e-resize',
            label: 'East resize anchor',
        },
        {
            x: boundingBox.x + boundingBox.width,
            y: boundingBox.y + boundingBox.height,
            moveAnchorTo: (x: number, y: number) => {
                onResized({
                    x: boundingBox.x,
                    width: Math.max(gap, x - boundingBox.x),

                    y: boundingBox.y,
                    height: Math.max(gap, y - boundingBox.y),
                });
            },
            cursor: 'se-resize',
            label: 'South east resize anchor',
        },
        {
            x: boundingBox.x + boundingBox.width / 2,
            y: boundingBox.y + boundingBox.height,
            moveAnchorTo: (_x: number, y: number) => {
                onResized({
                    ...boundingBox,
                    y: boundingBox.y,
                    height: Math.max(gap, y - boundingBox.y),
                });
            },
            cursor: 's-resize',
            label: 'South resize anchor',
        },
        {
            x: boundingBox.x,
            y: boundingBox.y + boundingBox.height,
            moveAnchorTo: (x: number, y: number) => {
                const x1 = Math.max(0, Math.min(x, boundingBox.x + boundingBox.width - gap));

                onResized({
                    x: x1,
                    width: Math.max(gap, boundingBox.width + boundingBox.x - x1),

                    y: boundingBox.y,
                    height: Math.max(gap, y - boundingBox.y),
                });
            },
            cursor: 'sw-resize',
            label: 'South west resize anchor',
        },
        {
            x: boundingBox.x,
            y: boundingBox.y + boundingBox.height / 2,
            moveAnchorTo: (x: number, _y: number) => {
                const x1 = Math.max(0, Math.min(x, boundingBox.x + boundingBox.width - gap));

                onResized({
                    ...boundingBox,
                    x: x1,
                    width: Math.max(gap, boundingBox.width + boundingBox.x - x1),
                });
            },
            cursor: 'w-resize',
            label: 'West resize anchor',
        },
    ];
};
