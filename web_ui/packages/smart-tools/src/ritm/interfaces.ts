// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { InferenceSession, Tensor } from 'onnxruntime-web';

import { Point, RegionOfInterest, ShapeType } from '../shared/interfaces';

export interface MainModelResponse {
    instances: Tensor;
    instances_aux: Tensor;
    feature: Tensor;
}

export interface Models {
    preprocess: InferenceSession;
    main: InferenceSession;
}

export interface RITMPoint {
    x: number;
    y: number;
    positive: boolean;
}

interface RITMMinAreaRect {
    angle: number;
    center: { x: number; y: number };
    size: { width: number; height: number };
}
export interface RITMContour {
    contour: Point[];
    area: number;
    score: number;
    minAreaRect: RITMMinAreaRect;
}

export interface RITMData {
    area: RegionOfInterest;
    givenPoints: RITMPoint[];
    outputShape: ShapeType;
}
