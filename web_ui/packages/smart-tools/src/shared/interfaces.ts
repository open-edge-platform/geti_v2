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
    readonly cx: number;
    readonly cy: number;
    readonly r: number;
    readonly shapeType: 'circle';
}

export interface Polygon {
    readonly points: Point[];
    readonly shapeType: 'polygon';
}
