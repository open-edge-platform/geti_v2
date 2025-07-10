// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { RegionOfInterest } from '../../../../core/annotations/annotation.interface';
import { Point, Shape } from '../../../../core/annotations/shapes.interface';
import { ShapeType } from '../../../../core/annotations/shapetype.enum';

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

export interface RITMResult {
    points: RITMPoint[];
    shape: Shape | undefined;
}

export interface RITMData {
    area: RegionOfInterest;
    givenPoints: RITMPoint[];
    outputShape: ShapeType;
}

export interface RITMContour {
    contour: Point[];
    area: number;
    score: number;
    minAreaRect: RITMMinAreaRect;
}

export const defaultRITMConfig = {
    dynamicBoxMode: true,
    rightClickMode: false,
};
