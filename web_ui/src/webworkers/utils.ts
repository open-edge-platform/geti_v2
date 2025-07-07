// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { approximateShape, getMatFromPoints, getPointsFromMat } from '@geti/smart-tools';
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
