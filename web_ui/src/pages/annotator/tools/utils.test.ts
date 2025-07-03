// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Shape as ToolShape } from '@geti/smart-tools/src/shared/interfaces';

import { RegionOfInterest } from '../../../core/annotations/annotation.interface';
import { BoundingBox } from '../../../core/annotations/math';
import { Circle, Point, Rect, Shape } from '../../../core/annotations/shapes.interface';
import { ShapeType } from '../../../core/annotations/shapetype.enum';
import { getMockedAnnotation } from '../../../test-utils/mocked-items-factory/mocked-annotations';
import {
    convertGetiShapeToToolShape,
    convertGetiShapeTypeToToolShapeType,
    convertToolShapeToGetiShape,
    isInsideBoundingBox,
    isPointWithinRoi,
    isRectWithinRoi,
    isShapeWithinRoi,
    removeOffLimitPointsPolygon,
    transformToClipperShape,
} from './utils';

describe('annotator utils', () => {
    describe('removeOffLimitPoints', () => {
        const roi: RegionOfInterest = {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
        };
        const getRect = (x: number, y: number): Rect => ({
            x,
            y,
            width: roi.width,
            height: roi.height,
            shapeType: ShapeType.Rect,
        });

        test.each([
            [
                'top',
                getRect(roi.x, -roi.height / 2),
                [
                    { x: 100, y: 50 },
                    { x: 0, y: 50 },
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                ],
            ],
            [
                'left/top corner',
                getRect(-roi.width / 2, -roi.height / 2),
                [
                    { x: 50, y: 50 },
                    { x: 0, y: 50 },
                    { x: 0, y: 0 },
                    { x: 50, y: 0 },
                ],
            ],
            [
                'left',
                getRect(-roi.width / 2, roi.y),
                [
                    { x: 50, y: 100 },
                    { x: 0, y: 100 },
                    { x: 0, y: 0 },
                    { x: 50, y: 0 },
                ],
            ],
            [
                'left/bottom corner',
                getRect(-roi.width / 2, roi.height / 2),
                [
                    { x: 50, y: 100 },
                    { x: 0, y: 100 },
                    { x: 0, y: 50 },
                    { x: 50, y: 50 },
                ],
            ],
            [
                'bottom',
                getRect(roi.x, roi.height / 2),
                [
                    { x: 100, y: 100 },
                    { x: 0, y: 100 },
                    { x: 0, y: 50 },
                    { x: 100, y: 50 },
                ],
            ],
            [
                'right/bottom corner',
                getRect(roi.width / 2, roi.height / 2),
                [
                    { x: 100, y: 100 },
                    { x: 50, y: 100 },
                    { x: 50, y: 50 },
                    { x: 100, y: 50 },
                ],
            ],
            [
                'right',
                getRect(roi.width / 2, roi.y),
                [
                    { x: 100, y: 100 },
                    { x: 50, y: 100 },
                    { x: 50, y: 0 },
                    { x: 100, y: 0 },
                ],
            ],
            [
                'right/top corner',
                getRect(roi.width / 2, -roi.height / 2),
                [
                    { x: 100, y: 50 },
                    { x: 50, y: 50 },
                    { x: 50, y: 0 },
                    { x: 100, y: 0 },
                ],
            ],
        ])('remove offlimit %o', (_, outlineShape: Rect, result): void => {
            const newShape = removeOffLimitPointsPolygon(outlineShape, roi);

            expect(newShape.points).toEqual(
                expect.arrayContaining([
                    expect.objectContaining(result[0]),
                    expect.objectContaining(result[1]),
                    expect.objectContaining(result[2]),
                    expect.objectContaining(result[3]),
                ])
            );

            const rioRect: Rect = { ...roi, shapeType: ShapeType.Rect };
            expect(transformToClipperShape(rioRect).totalArea()).toBeGreaterThan(
                transformToClipperShape(newShape).totalArea()
            );
            expect(newShape.shapeType).toBe(ShapeType.Polygon);
        });
    });

    describe('isPointWithinRoi', () => {
        const boundingBox = { x: 0, y: 0, width: 200, height: 100 };
        const testData: [Point, boolean][] = [
            [{ x: 25, y: 25 }, true],
            [{ x: -25, y: 25 }, false],
            [{ x: -25, y: -25 }, false],
            [{ x: 200, y: 100 }, true],
            [{ x: 201, y: 100 }, false],
            [{ x: 200, y: 101 }, false],
        ];
        test.each(testData)('test if point %s is inside of roi (%s)', (point, expectedResult) => {
            expect(isPointWithinRoi(boundingBox, point)).toEqual(expectedResult);
        });
    });

    describe('isShapeWithinRoi', () => {
        const roi = { x: 0, y: 0, width: 100, height: 100 };

        it('inside', () => {
            const circle: Circle = { x: 10, y: 10, r: 20, shapeType: ShapeType.Circle };
            expect(isShapeWithinRoi(roi, circle)).toBe(true);
        });

        it('partially inside', () => {
            const circle: Circle = { x: -19, y: 0, r: 20, shapeType: ShapeType.Circle };
            expect(isShapeWithinRoi(roi, circle)).toBe(true);
        });

        it('outside', () => {
            const circle: Circle = { x: -20, y: 0, r: 20, shapeType: ShapeType.Circle };
            expect(isShapeWithinRoi(roi, circle)).toBe(false);
        });
    });

    describe('isRectWithinRoi', () => {
        const roi = { x: 0, y: 0, width: 50, height: 50 };
        const rect: Rect = { ...roi, shapeType: ShapeType.Rect };

        it('inside', () => {
            expect(isRectWithinRoi(roi, rect)).toBe(true);
        });

        it('negative X', () => {
            expect(isRectWithinRoi(roi, { ...rect, x: -1 })).toBe(false);
        });

        it('invalid X', () => {
            expect(isRectWithinRoi(roi, { ...rect, x: roi.width + 1 })).toBe(false);
        });

        it('invalid With', () => {
            expect(isRectWithinRoi(roi, { ...rect, width: roi.width + 10 })).toBe(false);
        });

        it('negative Y', () => {
            expect(isRectWithinRoi(roi, { ...rect, y: -1 })).toBe(false);
        });

        it('invalid Y', () => {
            expect(isRectWithinRoi(roi, { ...rect, y: roi.height + 1 })).toBe(false);
        });

        it('invalid height', () => {
            expect(isRectWithinRoi(roi, { ...rect, height: roi.height + 10 })).toBe(false);
        });

        it('complex roi', () => {
            const complexRoi = { x: 2042, y: 1888, width: 1315, height: 854 };
            expect(
                isRectWithinRoi(complexRoi, {
                    ...rect,
                    x: 2803,
                    y: 2209,
                    width: 224,
                    height: 167,
                })
            ).toBe(true);
        });
    });

    describe('isInsideBoundingBox', () => {
        const boundingBox: BoundingBox = {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
        };

        describe('At least some part of the circle should be inside of the ROI(boundingBox)', () => {
            it('inside', () => {
                const circle = getMockedAnnotation(
                    { shape: { shapeType: ShapeType.Circle, x: 50, y: 50, r: 30 } },
                    ShapeType.Circle
                );
                expect(isInsideBoundingBox(circle)(boundingBox)).toBe(true);
            });

            it('partially inside', () => {
                const circle = getMockedAnnotation(
                    { shape: { shapeType: ShapeType.Circle, x: -29, y: 10, r: 30 } },
                    ShapeType.Circle
                );
                expect(isInsideBoundingBox(circle)(boundingBox)).toBe(true);
            });

            it('outinside', () => {
                const circle = getMockedAnnotation(
                    { shape: { shapeType: ShapeType.Circle, x: -32, y: 10, r: 30 } },
                    ShapeType.Circle
                );
                expect(isInsideBoundingBox(circle)(boundingBox)).toBe(false);
            });
        });
    });

    describe('convertToolShapeToGetiShape', () => {
        it('should convert polygon shape', () => {
            const shape: ToolShape = {
                shapeType: 'polygon',
                points: [
                    { x: 1, y: 2 },
                    { x: 3, y: 4 },
                ],
            };
            expect(convertToolShapeToGetiShape(shape)).toEqual({
                shapeType: ShapeType.Polygon,
                points: [
                    { x: 1, y: 2 },
                    { x: 3, y: 4 },
                ],
            });
        });

        it('should convert rotated-rect shape', () => {
            const shape: ToolShape = { shapeType: 'rotated-rect', x: 1, y: 2, width: 3, height: 4, angle: 45 };
            expect(convertToolShapeToGetiShape(shape)).toEqual({
                shapeType: ShapeType.RotatedRect,
                x: 1,
                y: 2,
                width: 3,
                height: 4,
                angle: 45,
            });
        });

        it('should convert rect shape', () => {
            const shape: ToolShape = { shapeType: 'rect', x: 5, y: 6, width: 7, height: 8 };
            expect(convertToolShapeToGetiShape(shape)).toEqual({
                shapeType: ShapeType.Rect,
                x: 5,
                y: 6,
                width: 7,
                height: 8,
            });
        });

        it('should convert circle shape', () => {
            const shape: ToolShape = { shapeType: 'circle', cx: 10, cy: 20, r: 5 };
            expect(convertToolShapeToGetiShape(shape)).toEqual({
                shapeType: ShapeType.Circle,
                x: 10,
                y: 20,
                r: 5,
            });
        });

        it('should throw error for unknown shape type', () => {
            // @ts-expect-error error is expected
            expect(() => convertToolShapeToGetiShape({ shapeType: 'unknown' })).toThrow('Unknown shape type');
        });
    });

    describe('convertGetiShapeTypeToToolShapeType', () => {
        it('should convert Rect', () => {
            expect(convertGetiShapeTypeToToolShapeType(ShapeType.Rect)).toBe('rect');
        });

        it('should convert RotatedRect', () => {
            expect(convertGetiShapeTypeToToolShapeType(ShapeType.RotatedRect)).toBe('rotated-rect');
        });

        it('should convert Polygon', () => {
            expect(convertGetiShapeTypeToToolShapeType(ShapeType.Polygon)).toBe('polygon');
        });

        it('should convert Circle', () => {
            expect(convertGetiShapeTypeToToolShapeType(ShapeType.Circle)).toBe('circle');
        });

        it('should throw error for unknown shape type', () => {
            // @ts-expect-error error is expected
            expect(() => convertGetiShapeTypeToToolShapeType('unknown')).toThrow('Unknown shape type');
        });
    });

    describe('convertGetiShapeToToolShape', () => {
        it('should convert Rect shape', () => {
            const shape: Shape = {
                shapeType: ShapeType.Rect,
                x: 10,
                y: 20,
                width: 30,
                height: 40,
            };
            expect(convertGetiShapeToToolShape(shape)).toEqual({
                shapeType: 'rect',
                x: 10,
                y: 20,
                width: 30,
                height: 40,
            });
        });

        it('should convert RotatedRect shape', () => {
            const shape: Shape = {
                shapeType: ShapeType.RotatedRect,
                x: 5,
                y: 6,
                width: 7,
                height: 8,
                angle: 15,
            };
            expect(convertGetiShapeToToolShape(shape)).toEqual({
                shapeType: 'rotated-rect',
                x: 5,
                y: 6,
                width: 7,
                height: 8,
                angle: 15,
            });
        });

        it('should convert Polygon shape', () => {
            const shape: Shape = {
                shapeType: ShapeType.Polygon,
                points: [
                    { x: 1, y: 2 },
                    { x: 3, y: 4 },
                ],
            };
            expect(convertGetiShapeToToolShape(shape)).toEqual({
                shapeType: 'polygon',
                points: [
                    { x: 1, y: 2 },
                    { x: 3, y: 4 },
                ],
            });
        });

        it('should convert Circle shape', () => {
            const shape: Shape = {
                shapeType: ShapeType.Circle,
                x: 11,
                y: 22,
                r: 33,
            };
            expect(convertGetiShapeToToolShape(shape)).toEqual({
                shapeType: 'circle',
                cx: 11,
                cy: 22,
                r: 33,
            });
        });

        it('should throw error for unknown shape type', () => {
            // @ts-expect-error error is expected
            expect(() => convertGetiShapeToToolShape({ shapeType: 'unknown' })).toThrow('Unknown shape type');
        });
    });
});
