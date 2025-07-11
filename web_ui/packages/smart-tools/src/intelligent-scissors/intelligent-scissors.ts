// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import type OpenCVTypes from 'OpenCVTypes';

import { Point, Polygon } from '../shared/interfaces';
import { OpenCVLoader } from '../utils/opencv-loader';
import { approximateShape, getMatFromPoints, getPointsFromMat } from '../utils/tool-utils';

interface IntelligentScissorsMB {
    setGradientMagnitudeMaxLimit: (gradient_magnitude_threshold_max: number) => void;
    setEdgeFeatureCannyParameters: (threshold1: number, threshold2: number) => void;
    applyImage: (image: OpenCVTypes.Mat) => void;
    buildMap: (sourcePt: Point) => void;
    getContour: (targetPt: Point, contour: OpenCVTypes.Mat, backward?: boolean) => void;
}

const maxRoiSize = 600;
const GRADIENT_MAGNITUDE = 200;
const FEATURE_CANNY_PARAMETERS = { threshold1: 16, threshold2: 100 };

const optimizePolygonAndCV = (CV: OpenCVTypes.cv, points: Point[], isClose = true): Point[] => {
    const pointsMat = getMatFromPoints(CV, points);
    const newContour = approximateShape(CV, pointsMat, isClose);
    pointsMat.delete();

    const newPoints = getPointsFromMat(newContour);
    newContour.delete();

    return newPoints;
};

const isPointOutsideOfBounds = (limit: OpenCVTypes.Rect, point: OpenCVTypes.Point | Point): boolean =>
    point.x <= limit.x || point.x >= limit.width || point.y <= limit.y || point.y >= limit.height;

class IntelligentScissors {
    img: OpenCVTypes.Mat;
    tool: IntelligentScissorsMB;
    hasInitialPoint: boolean;
    roiRect: OpenCVTypes.Rect | null;

    constructor(private CV: OpenCVTypes.cv) {
        this.roiRect = null;
        this.hasInitialPoint = false;
        this.tool = new this.CV.segmentation_IntelligentScissorsMB();
        this.tool.setGradientMagnitudeMaxLimit(GRADIENT_MAGNITUDE);
        this.tool.setEdgeFeatureCannyParameters(
            FEATURE_CANNY_PARAMETERS.threshold1,
            FEATURE_CANNY_PARAMETERS.threshold2
        );
    }

    loadImage(imageData: ImageData) {
        this.img = this.CV.matFromImageData(imageData) as OpenCVTypes.Mat;
    }

    buildMap(point: Point): void {
        this.hasInitialPoint = true;

        const { roiRect, roiImg } = this.getRoiAndCrop(this.img, point, maxRoiSize);
        this.roiRect = roiRect;

        try {
            this.tool.applyImage(roiImg);
            this.tool.buildMap(this.getRelativePoint(this.roiRect, point));
        } finally {
            roiImg?.delete();
        }
    }

    calcPoints(point: Point): Point[] {
        if (!this.hasInitialPoint) {
            return [];
        }

        const relativePoint = this.getRelativePoint(this.roiRect, point);
        const realLimit = this.getRelativeLimit(this.img, this.roiRect);

        if (isPointOutsideOfBounds(realLimit, relativePoint)) {
            return [];
        }

        const contour = new this.CV.Mat();
        try {
            this.tool.getContour(relativePoint, contour);
            return this.formatContourToPoints(contour, this.roiRect);
        } finally {
            contour?.delete();
        }
    }

    getRoiAndCrop(
        src: OpenCVTypes.Mat,
        point: Point,
        roiSize: number
    ): { roiRect: OpenCVTypes.Rect | null; roiImg: OpenCVTypes.Mat } {
        if (src.cols > roiSize) {
            const roiRect = this.getRoiRect(this.img, point, maxRoiSize);
            const roiImg = this.cropArea(this.img, roiRect);

            return { roiRect, roiImg };
        }

        return { roiRect: null, roiImg: src.clone() };
    }

    getRoiRect(src: OpenCVTypes.Mat, point: Point, roiSize: number): OpenCVTypes.Rect {
        const finalRioSize = roiSize / 2;
        const x = Math.round(Math.max(0, point.x - finalRioSize));
        const y = Math.round(Math.max(0, point.y - finalRioSize));
        const width = roiSize + x > src.cols ? src.cols - x : roiSize;
        const height = roiSize + y > src.rows ? src.rows - y : roiSize;

        return new this.CV.Rect(x, y, width, height);
    }

    cropArea(src: OpenCVTypes.Mat, rect: OpenCVTypes.Rect): OpenCVTypes.Mat {
        let dst = new this.CV.Mat();
        dst = src.roi(rect);

        return dst;
    }

    formatContourToPoints(contour: OpenCVTypes.Mat, rectOffset: OpenCVTypes.Rect | null): Point[] {
        const points: Point[] = [];
        const { x: offsetX, y: offsetY } = rectOffset ?? { x: 0, y: 0 };
        for (let row = 0; row < contour.rows; row++) {
            points.push({
                x: Math.round(contour.intAt(row, 0) + offsetX),
                y: Math.round(contour.intAt(row, 1) + offsetY),
            });
        }

        return points;
    }

    getRelativePoint(roiRect: OpenCVTypes.Rect | null, point: Point): OpenCVTypes.Point {
        if (roiRect === null) {
            return new this.CV.Point(point.x, point.y);
        }
        return new this.CV.Point(point.x - roiRect.x, point.y - roiRect.y);
    }

    getRelativeLimit(
        src: OpenCVTypes.Mat,
        roiRect: OpenCVTypes.Rect | null
    ): { x: number; y: number; width: number; height: number } {
        return {
            x: 0,
            y: 0,
            width: roiRect ? roiRect.width : src.cols,
            height: roiRect ? roiRect.height : src.rows,
        };
    }

    optimizePolygon(prevPolygon: Polygon): Polygon {
        return { ...prevPolygon, points: optimizePolygonAndCV(this.CV, prevPolygon.points) };
    }

    optimizeSegments(segments: Point[][]): Polygon {
        const optimizeOrReturnSegment = (segment: Point[]) =>
            segment.length > 1 ? optimizePolygonAndCV(this.CV, segment, false) : segment;

        const points = segments.map(optimizeOrReturnSegment).flat();

        return { shapeType: 'polygon', points };
    }

    cleanPoints(): void {
        this.hasInitialPoint = false;
    }

    cleanImg(): void {
        this.img?.delete();
        this.roiRect = null;
    }

    terminate() {
        self.close();
    }
}

const buildIntelligentScissorsInstance = async (): Promise<IntelligentScissors> => {
    const opencv = await OpenCVLoader();

    return new IntelligentScissors(opencv);
};

export { buildIntelligentScissorsInstance, IntelligentScissors };
