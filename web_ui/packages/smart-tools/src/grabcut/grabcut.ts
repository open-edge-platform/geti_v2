// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import type OpenCVTypes from 'OpenCVTypes';

import { Point, Polygon, Rect } from '../shared/interfaces';
import { OpenCVLoader } from '../utils/opencv-loader';
import { approximateShape, getMatFromPoints, getPointsFromMat } from '../utils/tool-utils';
import { GrabcutData, GrabcutDependencies } from './interfaces';

class Grabcut {
    img: OpenCVTypes.Mat;
    mask: OpenCVTypes.Mat;
    bgdModel: OpenCVTypes.Mat;
    fgdModel: OpenCVTypes.Mat;

    constructor(private CV: OpenCVTypes.cv) {}

    loadImage(imageData: ImageData) {
        this.cleanModels();

        this.mask = new this.CV.Mat();
        this.bgdModel = new this.CV.Mat();
        this.fgdModel = new this.CV.Mat();
        this.img = this.getImage(imageData);
    }

    startGrabcut(data: GrabcutData): Polygon {
        const roiRect = this.formatRoiRect(data.inputRect);
        const scale = this.getScale(roiRect, data.sensitivity);
        const resizedImg = this.cropAndResize(this.img, roiRect, scale);
        const hasMarkers = data.foreground.length || data.background.length;

        const runGrabcut = () =>
            this.mask.matSize.length && hasMarkers
                ? this.runGrabcutMask({ ...data, roiRect, resizedImg, scale })
                : this.runGrabcutRect({ roiRect, resizedImg, scale });

        try {
            return {
                points: runGrabcut(),
                shapeType: 'polygon',
            };
        } finally {
            resizedImg.delete();
        }
    }

    runGrabcutRect({ roiRect, resizedImg, scale }: GrabcutDependencies): Point[] {
        const { width, height } = roiRect;
        const initMask = new this.CV.Mat(
            width,
            height,
            this.CV.CV_8U,
            new this.CV.Scalar(this.CV.GC_PR_BGD)
        ) as OpenCVTypes.Mat;
        let resizedMask = this.resize(initMask, scale);
        const selectionRoiRect = this.getSelection(resizedImg);

        this.CV.grabCut(
            resizedImg,
            resizedMask,
            selectionRoiRect,
            this.bgdModel,
            this.fgdModel,
            2,
            this.CV.GC_INIT_WITH_RECT
        );
        resizedMask = this.maxSideResize(resizedMask, scale, { width, height });

        try {
            return this.extractPolygons(resizedMask, roiRect, scale);
        } finally {
            this.mask.delete();
            this.mask = resizedMask.clone();
            resizedMask?.delete();
        }
    }

    runGrabcutMask({
        scale,
        inOrder,
        resizedImg,
        strokeWidth,
        roiRect,
        foreground = [],
        background = [],
    }: GrabcutData & GrabcutDependencies): Point[] {
        const markersMask = this.mask.clone();
        this.applyMarkersByOrder(markersMask, inOrder, foreground, background, strokeWidth, roiRect);
        let resizedMask = this.resize(markersMask, scale);

        this.CV.grabCut(
            resizedImg,
            resizedMask,
            new this.CV.Rect(),
            this.bgdModel,
            this.fgdModel,
            2,
            this.CV.GC_INIT_WITH_MASK
        );

        resizedMask = this.maxSideResize(resizedMask, scale, {
            width: roiRect.width,
            height: roiRect.height,
        });

        try {
            return this.extractPolygons(resizedMask, roiRect, scale);
        } finally {
            resizedMask?.delete();
        }
    }

    getSelection(img: OpenCVTypes.Mat): OpenCVTypes.Rect {
        return new this.CV.Rect(1, 1, img.cols - 2, img.rows - 2);
    }

    extractPolygons(src: OpenCVTypes.Mat, roiRect: OpenCVTypes.Rect, scale: number): Point[] {
        let thresholdMask;
        let contours;
        let contour;
        let points = [];

        try {
            thresholdMask = this.threshold(src);
            this.removeBorderContour(thresholdMask, scale);
            contours = this.getContours(thresholdMask);
            contour = this.getPolygonWithLargestArea(contours);
            points = this.closePoints(this.formatContourToPoints(contour, roiRect));

            return points;
        } finally {
            contour?.delete();
            contours?.delete();
            thresholdMask?.delete();
        }
    }

    removeBorderContour(src: OpenCVTypes.Mat, scale: number): void {
        if (scale > 1) {
            new this.CV.rectangle(
                src,
                { x: 0, y: 0 },
                { x: src.cols, y: src.rows },
                new this.CV.Scalar(this.CV.GC_BGD),
                8
            );
        }
    }

    threshold(src: OpenCVTypes.Mat): OpenCVTypes.Mat {
        const fgMask = new this.CV.Mat();
        const prFgMask = new this.CV.Mat();
        const finalMask = new this.CV.Mat();
        const white = 255;

        try {
            this.CV.threshold(src, prFgMask, this.CV.GC_PR_BGD, white, this.CV.THRESH_BINARY);
            this.CV.threshold(src, fgMask, this.CV.GC_FGD, 0, this.CV.THRESH_TOZERO_INV);
            this.CV.threshold(fgMask, fgMask, this.CV.GC_BGD, white, this.CV.THRESH_BINARY);
            this.CV.bitwise_or(prFgMask, fgMask, finalMask);

            return finalMask;
        } finally {
            fgMask?.delete();
            prFgMask?.delete();
        }
    }

    getImage(imageData: ImageData): OpenCVTypes.Mat {
        const data = this.CV.matFromImageData(imageData);
        this.CV.cvtColor(data, data, this.CV.COLOR_RGBA2RGB, 0);
        return data;
    }

    formatRoiRect(rect: Rect): OpenCVTypes.Rect {
        return new this.CV.Rect(rect.x, rect.y, rect.width, rect.height);
    }

    applyMarkersByOrder(
        src: OpenCVTypes.Mat,
        inOrder: boolean,
        foreground: Point[][],
        background: Point[][],
        strokeWidth: number,
        rectOffset: OpenCVTypes.Rect
    ): void {
        const applyBackgroundOrNothing = () =>
            background.length && this.applyMarkers(src, background, this.CV.GC_BGD, strokeWidth, rectOffset);

        const applyForegroundOrNothing = () =>
            foreground.length && this.applyMarkers(src, foreground, this.CV.GC_FGD, strokeWidth, rectOffset);

        if (inOrder) {
            applyBackgroundOrNothing();
            applyForegroundOrNothing();
        } else {
            applyForegroundOrNothing();
            applyBackgroundOrNothing();
        }
    }

    applyMarkers(
        src: OpenCVTypes.Mat,
        markers: Point[][],
        colorIdx: number,
        strokeWidth: number,
        rectOffset: OpenCVTypes.Rect
    ): void {
        const markersVector = new this.CV.MatVector();

        markers.forEach((marker) => {
            const marketMat = getMatFromPoints(this.CV, marker, { x: -rectOffset.x, y: -rectOffset.y });
            markersVector.push_back(marketMat);
            marketMat.delete();
        });

        this.CV.polylines(src, markersVector, false, new this.CV.Scalar(colorIdx), strokeWidth);
        markersVector.delete();
    }

    cropAndResize(src: OpenCVTypes.Mat, roiRect: OpenCVTypes.Rect, scale: number): OpenCVTypes.Mat {
        const roiSrc = this.cropArea(src, roiRect);
        return this.resize(roiSrc, scale);
    }

    resize(src: OpenCVTypes.Mat, scale: number): OpenCVTypes.Mat {
        const size = new this.CV.Size(src.cols / scale, src.rows / scale);

        return this.maxSideResize(src, scale, size);
    }

    cropArea(src: OpenCVTypes.Mat, rect: OpenCVTypes.Rect): OpenCVTypes.Mat {
        let dst = new this.CV.Mat();

        dst = src.roi(rect);

        return dst;
    }

    maxSideResize(src: OpenCVTypes.Mat, scale: number, size: OpenCVTypes.Size): OpenCVTypes.Mat {
        if (scale > 1) {
            const dst = new this.CV.Mat();

            this.CV.resize(src, dst, size, 0, 0, this.CV.INTER_AREA);
            src.delete();

            return dst;
        }

        return src;
    }

    getScale(rect: OpenCVTypes.Rect, sensitivity: number): number {
        return Math.max(rect.width, rect.height) / Math.pow(sensitivity, 2);
    }

    getContours(src: OpenCVTypes.Mat): OpenCVTypes.MatVector {
        const contours = new this.CV.MatVector();

        this.CV.findContours(src, contours, new this.CV.Mat(), this.CV.RETR_EXTERNAL, this.CV.CHAIN_APPROX_SIMPLE);

        return contours;
    }

    formatContourToPoints(contour: OpenCVTypes.Mat, rectOffset: OpenCVTypes.Rect): Point[] {
        if (!contour?.rows) {
            return [];
        }

        const newContour = approximateShape(this.CV, contour);
        const points = getPointsFromMat(newContour, rectOffset);
        newContour?.delete();
        return points;
    }

    closePoints(points: Point[]): Point[] {
        if (!points.length) {
            return points;
        }

        const [first] = points;

        return [...points, { x: first.x, y: first.y }];
    }

    getPolygonWithLargestArea(contours: OpenCVTypes.MatVector): OpenCVTypes.Mat {
        let maxContour = contours.get(0);
        let maxArea = -1;
        let maxSize = -1;

        for (let idx = 0; idx < contours.size(); idx++) {
            const contour = contours.get(idx);

            // https://docs.this.CV.org/master/d3/dc0/group__imgproc__shape.html#ga2c759ed9f497d4a618048a2f56dc97f1
            const area = this.CV.contourArea(contour, false);
            const [rows, cols] = contour.matSize;
            const currentMaxSize = rows + cols;

            if (area > maxArea && currentMaxSize > maxSize) {
                maxArea = area;
                maxContour = contour;
                maxSize = currentMaxSize;
            }
        }

        return maxContour;
    }

    cleanModels(): void {
        if (this.img) {
            this.img.delete();
            this.img = null;
        }

        if (this.mask) {
            this.mask.delete();
            this.mask = null;
        }

        if (this.bgdModel) {
            this.bgdModel.delete();
            this.bgdModel = null;
        }

        if (this.fgdModel) {
            this.fgdModel.delete();
            this.fgdModel = null;
        }
    }

    terminate() {
        self.close();
    }
}

const buildGrabcutInstance = async (): Promise<Grabcut> => {
    const opencv = await OpenCVLoader();

    return new Grabcut(opencv);
};

export { buildGrabcutInstance, Grabcut };
