// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { PointerEvent } from 'react';

import { isEmpty } from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';

import { Annotation, RegionOfInterest } from '../core/annotations/annotation.interface';
import { clampBetween } from '../core/annotations/math';
import { KeypointNode, Point } from '../core/annotations/shapes.interface';
import { isEmptyLabel } from '../core/labels/utils';
import { KeypointStructure } from '../core/projects/task.interface';
import { VALID_IMAGE_TYPES_SINGLE_UPLOAD } from '../shared/media-utils';
import { PointerType } from './annotator/tools/tools.interface';
import { isEraserOrRightButton, isLeftButton, MouseButton } from './buttons-utils';

type PointerSVGElement = PointerEvent<SVGElement>;
type CallbackPointerVoid = (event: PointerSVGElement) => void;

export interface TemplateState {
    edges: EdgeLine[];
    points: KeypointNode[];
}

export interface TemplateStateWithHistory extends TemplateState {
    skipHistory?: boolean;
}

export enum PointAxis {
    X = 'x',
    Y = 'y',
}

export interface EdgeLine {
    id: string;
    from: KeypointNode;
    to: KeypointNode;
}

export const KEYPOINT_RADIUS = 6;

export const isSupportedImageFormat = (file: File): boolean => {
    const fileType = file.type ? file.type.split('/')[1] : ''; // image/png -> png

    return fileType ? VALID_IMAGE_TYPES_SINGLE_UPLOAD.includes(fileType) : false;
};

export const isEmptyLabelAnnotation = (annotation: Annotation): boolean => annotation.labels.some(isEmptyLabel);

type RGBArray = [number, number, number, number];
export const hexaToRGBA = (hex: string): RGBArray => {
    if (isEmpty(hex)) {
        return [0, 0, 0, 0];
    }

    if (hex.length == 9) {
        return [
            Number('0x' + hex[1] + hex[2]),
            Number('0x' + hex[3] + hex[4]),
            Number('0x' + hex[5] + hex[6]),
            Number('0x' + hex[7] + hex[8]),
        ];
    }

    const alpha = Number('0x' + hex[4] + hex[4]);

    return [
        Number('0x' + hex[1] + hex[1]),
        Number('0x' + hex[2] + hex[2]),
        Number('0x' + hex[3] + hex[3]),
        Number.isNaN(alpha) ? 1 : alpha,
    ];
};

// source https://css-tricks.com/css-variables-calc-rgb-enforcing-high-contrast-colors/
export const getForegroundColor = (backgroundRgb: RGBArray, lowContrast: string, highContrast: string): string => {
    const [r, g, b] = backgroundRgb;
    const sum = Math.round((r * 299 + g * 587 + b * 114) / 1000);

    return sum > 128 ? lowContrast : highContrast;
};

type ElementType = SVGElement | HTMLDivElement;
export const getRelativePoint = (element: ElementType, point: Point, zoom: number): Point => {
    const rect = element.getBoundingClientRect();

    return {
        x: Math.round((point.x - rect.left) / zoom),
        y: Math.round((point.y - rect.top) / zoom),
    };
};

const mouseButtonEventValidation =
    (callback: CallbackPointerVoid) => (predicate: (button: MouseButton) => boolean) => (event: PointerSVGElement) => {
        event.preventDefault();

        if (event.pointerType === PointerType.Touch) return;

        const button = {
            button: event.button,
            buttons: event.buttons,
        };

        if (predicate(button)) {
            callback(event);
        }
    };

export const leftMouseButtonHandler = (callback: CallbackPointerVoid): CallbackPointerVoid =>
    mouseButtonEventValidation(callback)(isLeftButton);

export const rightMouseButtonHandler = (callback: CallbackPointerVoid): CallbackPointerVoid =>
    mouseButtonEventValidation(callback)(isEraserOrRightButton);

export const leftRightMouseButtonHandler =
    (leftCallback: CallbackPointerVoid, rightCallback: CallbackPointerVoid) =>
    (event: PointerSVGElement): void => {
        leftMouseButtonHandler(leftCallback)(event);
        rightMouseButtonHandler(rightCallback)(event);
    };

export const getPointInRoi = <T extends Point>(point: T, roi: RegionOfInterest): T => {
    const constrainedX = clampBetween(roi.x, point.x, roi.width);
    const constrainedY = clampBetween(roi.y, point.y, roi.height);

    return { ...point, x: constrainedX, y: constrainedY };
};

type ProjectLine = [startPoint: Point, endPoint: Point];

export const projectPointOnLine = ([startPoint, endPoint]: ProjectLine, point: Point): Point | undefined => {
    // Move startPoint to origin
    const b = {
        x: endPoint.x - startPoint.x,
        y: endPoint.y - startPoint.y,
    };
    const a = {
        x: point.x - startPoint.x,
        y: point.y - startPoint.y,
    };

    // Project a onto b
    const aDotB = a.x * b.x + a.y * b.y;
    const bDotB = b.x * b.x + b.y * b.y;
    const scale = aDotB / bDotB;

    // Return undefined if the projected point would lie outside of the given line
    if (scale < 0 || scale > 1) {
        return undefined;
    }

    // Move origin back to startPoint
    return {
        x: b.x * scale + startPoint.x,
        y: b.y * scale + startPoint.y,
    };
};

const hasEqualLabelId = (id: string) => (point: KeypointNode) => point.label.id === id;

export const getInitialKeypointStructure = ({ edges, positions }: KeypointStructure): TemplateState => {
    const linkedEdged = edges.map(({ nodes: [fromId, toId] }) => {
        const toLabel = positions.find(hasEqualLabelId(fromId));
        const fromLabel = positions.find(hasEqualLabelId(toId));

        return { id: uuidv4(), from: toLabel, to: fromLabel } as EdgeLine;
    });

    return { edges: linkedEdged, points: positions };
};

export const getMaxMinPoint = <T extends Point>(points: T[], pointAxis: PointAxis) => {
    const [minAxisValue, maxAxisValue] = points.reduce(
        ([min, max], point) => [Math.min(min, point[pointAxis]), Math.max(max, point[pointAxis])],
        [Infinity, -Infinity]
    );
    return [minAxisValue, maxAxisValue];
};
