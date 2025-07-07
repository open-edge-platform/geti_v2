// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { VALID_IMAGE_TYPES_SINGLE_UPLOAD } from '../shared/media-utils';
import {
    getForegroundColor,
    getMaxMinPoint,
    getPointInRoi,
    hexaToRGBA,
    isSupportedImageFormat,
    onValidImageFormat,
    PointAxis,
} from './utils';

const mockedRoi = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
};

describe('page utils', () => {
    describe('isSupportedImageFormat', () => {
        it('valid file', () => {
            const validFile = new File(['foo'], 'foo.txt', {
                type: `img/${VALID_IMAGE_TYPES_SINGLE_UPLOAD[0]}`,
            });

            expect(isSupportedImageFormat(validFile)).toBe(true);
        });

        it('invalid file', () => {
            const invalidFile = new File(['foo'], 'foo.txt', {
                type: 'text/plain',
            });

            expect(isSupportedImageFormat(invalidFile)).toBe(false);
        });

        it('no type', () => {
            const invalidFile = new File(['foo'], 'foo.txt');
            expect(isSupportedImageFormat(invalidFile)).toBe(false);
        });
    });

    it('hexaToRGBA', () => {
        expect(hexaToRGBA('')).toEqual([0, 0, 0, 0]);
        expect(hexaToRGBA('#000')).toEqual([0, 0, 0, 1]);
        expect(hexaToRGBA('#fffff')).toEqual([255, 255, 255, 255]);
        expect(hexaToRGBA('#000000ff')).toEqual([0, 0, 0, 255]);
    });

    it('getForegroundColor', () => {
        const lowContrast = 'test-1';
        const highContrast = 'test-2';

        expect(getForegroundColor([0, 0, 0, 0], lowContrast, highContrast)).toBe(highContrast);
        expect(getForegroundColor([255, 255, 255, 255], lowContrast, highContrast)).toBe(lowContrast);
    });

    it('getPointInRoi', () => {
        const xUnderRoi = { x: mockedRoi.x - 10, y: mockedRoi.y };
        const xAboveRoi = { x: mockedRoi.width + 10, y: mockedRoi.y };
        const yUnderRoi = { x: mockedRoi.x, y: mockedRoi.y - 10 };
        const yAboveRoi = { x: mockedRoi.x, y: mockedRoi.height + 10 };

        expect(getPointInRoi(xUnderRoi, mockedRoi).x).toEqual(mockedRoi.x);
        expect(getPointInRoi(xAboveRoi, mockedRoi).x).toEqual(mockedRoi.width);

        expect(getPointInRoi(yUnderRoi, mockedRoi).y).toEqual(mockedRoi.y);
        expect(getPointInRoi(yAboveRoi, mockedRoi).y).toEqual(mockedRoi.height);
    });

    it('getMaxMinPoint', () => {
        const points = [
            { x: 10, y: 20 },
            { x: 5, y: 30 },
            { x: 15, y: 10 },
        ];

        const [minX, maxX] = getMaxMinPoint(points, PointAxis.X);
        const [minY, maxY] = getMaxMinPoint(points, PointAxis.Y);

        expect(minX).toEqual(5);
        expect(maxX).toEqual(15);
        expect(minY).toEqual(10);
        expect(maxY).toEqual(30);
    });

    describe('onValidImageFormat', () => {
        const validFiles = [
            new File(['foo'], 'foo.jpg', { type: `image/${VALID_IMAGE_TYPES_SINGLE_UPLOAD[0]}` }),
            new File(['bar'], 'bar.png', { type: `image/${VALID_IMAGE_TYPES_SINGLE_UPLOAD[1]}` }),
        ];

        const invalidFiles = [
            new File(['bar'], 'bar.pdf', { type: 'application/pdf' }),
            new File(['foo'], 'video.mov', { type: 'video/quicktime' }),
        ];

        it('invoke callback function when all provided files have valid image formats', () => {
            const mockedCallback = jest.fn();
            const mockedErrorCallback = jest.fn();
            onValidImageFormat(mockedCallback, mockedErrorCallback)(validFiles);

            expect(mockedCallback).toHaveBeenCalledWith(validFiles);
            expect(mockedErrorCallback).not.toHaveBeenCalled();
        });

        it('invoke error callback when files with unsupported formats are provided', () => {
            const mockedCallback = jest.fn();
            const mockedErrorCallback = jest.fn();
            onValidImageFormat(mockedCallback, mockedErrorCallback)(invalidFiles);

            expect(mockedCallback).not.toHaveBeenCalled();
            expect(mockedErrorCallback).toHaveBeenCalledWith(invalidFiles);
        });
    });
});
