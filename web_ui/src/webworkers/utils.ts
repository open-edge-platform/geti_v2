// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { approximateShape } from '@geti/smart-tools';
import axios from 'axios';
import type OpenCVTypes from 'OpenCVTypes';

import { Point } from '../core/annotations/shapes.interface';

export const isPointOutsideOfBounds = (limit: OpenCVTypes.Rect, point: OpenCVTypes.Point | Point): boolean =>
    point.x <= limit.x || point.x >= limit.width || point.y <= limit.y || point.y >= limit.height;

export const optimizePolygonAndCV = (CV: OpenCVTypes.cv, points: Point[], isClose = true): Point[] => {
    const pointsMat = getMatFromPoints(CV, points);
    const newContour = approximateShape(CV, pointsMat, isClose);
    pointsMat.delete();

    const newPoints = getPointsFromMat(newContour);
    newContour.delete();

    return newPoints;
};

export const getMatFromPoints = (CV: OpenCVTypes.cv, points: Point[], offset = { x: 0, y: 0 }): OpenCVTypes.Mat => {
    const pointsMat = new CV.Mat(points.length, 1, CV.CV_32SC2);

    points.forEach(({ x, y }, idx) => {
        pointsMat.intPtr(idx, 0)[0] = x + offset.x;
        pointsMat.intPtr(idx, 0)[1] = y + offset.y;
    });

    return pointsMat;
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

// For debugging purposes, not being used atm
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logMat = (mat: OpenCVTypes.Mat, name: string): void => {
    // eslint-disable-next-line no-console
    console.log(
        `${name} width: ${mat.cols}
        ${name} height: ${mat.rows}
        ${name} size: ${mat.size().width * mat.size().height}
        ${name} depth: ${mat.depth()}
        ${name} channels: ${mat.channels()}
        ${name} type:${mat.type()}`
    );
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

const numberFormatter = new Intl.NumberFormat('en-GB', {
    style: 'unit',
    unit: 'megabyte',
    unitDisplay: 'short',
});

// For debugging purposes, not being used atm
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const reportOpenCVMemoryUsage = (CV: OpenCVTypes.cv, message = '') => {
    const byteLength = CV.asm.memory.buffer.byteLength;

    console.info(`${message} OpenCV Memory: ${numberFormatter.format(byteLength / 1024 / 1024)}`);
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

export const getBlobFromDataUrl = async (dataUrl: string): Promise<Blob> => {
    const response = await axios.get(dataUrl, {
        responseType: 'blob',
    });

    return response.data;
};

/*
    1) Gets the blob from the source data url
    2) Converts the .webp blob to .jpeg blob if necessary
    3) Creates and returns a new file based on the blob
*/
export const fetchMediaAndConvertToFile = async (id: string, dataUrl: string) => {
    const blob = await getBlobFromDataUrl(dataUrl);

    if (blob === undefined) {
        return;
    }

    const fileType = blob.type.split('/').pop();
    const fileName = `${id}.${fileType}`;

    return new File([blob], fileName, { type: blob.type });
};
