// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { SSIM } from '@geti/smart-tools';

import { RegionOfInterest } from '../../../../core/annotations/annotation.interface';
import { Rect, Shape } from '../../../../core/annotations/shapes.interface';
import { ShapeType } from '../../../../core/annotations/shapetype.enum';
import { AlgorithmType } from '../../../../hooks/use-load-ai-webworker/algorithm.interface';
import { WebWorker } from '../../../../webworkers/web-worker.interface';

export const MINIMUM_THRESHOLD = 0.7;

export interface RunSSIMProps {
    imageData: ImageData;
    roi: RegionOfInterest;
    template: Rect;
    existingAnnotations: Shape[];
    autoMergeDuplicates: boolean;
    shapeType: ShapeType;
}

export interface SSIMState {
    shapes: Shape[];
    matches: SSIMMatch[];
    threshold: number;
}

export interface SSIMMatch {
    shape: Rect;
    confidence: number;
}

export interface SSIMWorker extends WebWorker {
    build: () => Promise<SSIM>;
    type: AlgorithmType.SSIM;
}
