// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

export { OpenCVLoader } from './opencv-loader';
export {
    formatContourToPoints,
    approximateShape,
    formatImageData,
    loadSource,
    concatFloat32Arrays,
    stackPlanes,
    isPolygonValid,
    getPointsFromMat,
    getMatFromPoints,
} from './tool-utils';
export * as Vec2 from './vec2';
export {
    degreesToRadians,
    radiansToDegrees,
    rotateDeg,
    clampBetween,
    pointsToRect,
    calculateDistance,
    rotatedRectCorners,
    highestCorner,
    lowestCorner,
    roiFromImage,
    clampPointBetweenImage,
    isPointOverPoint,
    isValueBetween,
    sgn,
    getIntersectionPoint,
    pointInRectangle,
    pointInRotatedRectangle,
    pointInCircle,
    pointInPolygon,
    isPointInShape,
    getBoundingBox,
    getShapesBoundingBox,
    getCenterOfTheAnnotations,
    isInsideOfBoundingBox,
    getCenterOfShape,
    hasEqualBoundingBox,
    clampBox,
    type BoundingBox,
} from './math';
export {
    transformPointInRotatedRectToScreenSpace,
    calculateSizeAndPositionBasedOfCornerAnchor,
    calculateSizeAndPositionOfSideAnchor,
    cursorForDirection,
    rectToRotatedRect,
} from './rotated-rect-math';
