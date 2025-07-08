// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import type OpenCVTypes from 'OpenCVTypes';

import { Point, Rect } from '../shared/interfaces';

export interface GrabcutDependencies {
    scale: number;
    roiRect: OpenCVTypes.Rect;
    resizedImg: OpenCVTypes.Mat;
}

export interface GrabcutData {
    inputRect: Rect;
    strokeWidth: number;
    sensitivity: number;
    foreground: Point[][];
    background: Point[][];
    image: ImageData;
    inOrder: boolean;
}
