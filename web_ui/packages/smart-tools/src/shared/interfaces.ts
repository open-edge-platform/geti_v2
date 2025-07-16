// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

export interface Point {
    x: number;
    y: number;
}

export interface Rect extends Point {
    readonly width: number;
    readonly height: number;
    readonly shapeType: 'rect';
}

export interface RotatedRect extends Point {
    readonly width: number;
    readonly height: number;
    readonly angle: number; // In degrees
    readonly shapeType: 'rotated-rect';
}

export interface Circle {
    readonly x: number;
    readonly y: number;
    readonly r: number;
    readonly shapeType: 'circle';
}

export interface Polygon {
    readonly points: Point[];
    readonly shapeType: 'polygon';
}

export interface Pose {
    // NOTE: this is not fully compatible with Geti's type
    readonly points: Point[];
    readonly shapeType: 'pose';
}

export type Shape = Rect | RotatedRect | Circle | Polygon | Pose;
export type ShapeType = Shape['shapeType'];

export interface RegionOfInterest {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Vector has the same interface as Point but can be confusing if used interchangeably
export interface Vector {
    x: number;
    y: number;
}
