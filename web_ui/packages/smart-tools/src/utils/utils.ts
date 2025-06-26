// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import type OpenCVTypes from 'OpenCVTypes';

import { Point } from '../shared/interfaces';

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
