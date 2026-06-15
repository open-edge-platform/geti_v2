// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Tensor } from 'onnxruntime-web';

import type { OpenCVTypes } from '../opencv/interfaces';
import { Point, ShapeType } from '../shared/interfaces';
import { isPointInShape } from '../utils/math';
import type { SegmentAnythingResult } from './interfaces';
import { PostProcessor } from './post-processing';
import { EncodingOutput } from './segment-anything-encoder';
import { type Session } from './session';

type InteractiveAnnotationPoint = Point & { positive: boolean };

export interface SegmentAnythingPrompt {
    points: InteractiveAnnotationPoint[] | undefined;
    boxes: Point[][] | undefined;
    outputConfig: { type: ShapeType };
}

const argmax = (data: ArrayLike<number>, length: number): number => {
    let best = 0;
    for (let i = 1; i < length; i++) {
        if (data[i] > data[best]) best = i;
    }
    return best;
};

export class SegmentAnythingDecoder {
    constructor(
        private cv: OpenCVTypes,
        private session: Session
    ) {}

    public async process(encodingOutput: EncodingOutput, input: SegmentAnythingPrompt): Promise<SegmentAnythingResult> {
        const points = input.points ?? [];
        const boxes = input.boxes ?? [];
        const { masks, iouPredictions } = await this.runDecoder(points, boxes, encodingOutput);

        const [, , height, width] = masks.dims;
        const maskIdx = argmax(iouPredictions.data as ArrayLike<number>, iouPredictions.dims[1]);
        const maskOffset = maskIdx * height * width;

        const pixels = new Uint8ClampedArray(height * width);
        for (let i = 0; i < pixels.length; i++) {
            pixels[i] = Number(masks.data[maskOffset + i]) > 0 ? 255 : 0;
        }

        const positivePoints = points.filter(({ positive }) => positive);

        return new PostProcessor(this.cv).maskToAnnotationShape(
            pixels,
            {
                width,
                height,
                originalWidth: encodingOutput.originalWidth + 1,
                originalHeight: encodingOutput.originalHeight + 1,
            },
            {
                ...input.outputConfig,
                shapeFilter: (shape) => positivePoints.some((point) => isPointInShape(shape, point)),
            }
        );
    }

    private async runDecoder(
        points: InteractiveAnnotationPoint[],
        boxes: Point[][],
        { encoderResult, originalWidth, originalHeight, newWidth, newHeight }: EncodingOutput
    ): Promise<{ masks: Tensor; iouPredictions: Tensor }> {
        const xRatio = newWidth / originalWidth;
        const yRatio = newHeight / originalHeight;

        const pointCoords: number[] = [];
        const pointLabels: number[] = [];

        for (const p of points) {
            pointCoords.push(p.x * xRatio, p.y * yRatio);
            pointLabels.push(p.positive ? 1 : 0);
        }

        if (boxes.length === 0) {
            // SAM requires at least one extra padding point when no box is given.
            pointCoords.push(0, 0);
            pointLabels.push(-1);
        }

        for (const [tl, br] of boxes) {
            pointCoords.push(tl.x * xRatio, tl.y * yRatio, br.x * xRatio, br.y * yRatio);
            pointLabels.push(2, 3);
        }

        const ratio = 1024 / Math.max(originalHeight, originalWidth);
        // TODO: reuse the low_res_masks output, also use existing polygons?
        const feeds: Record<string, Tensor> = {
            image_embeddings: new Tensor(encoderResult.type, encoderResult.data, encoderResult.dims),
            mask_input: new Tensor(new Float32Array(256 * 256).fill(1), [1, 1, 256, 256]),
            has_mask_input: new Tensor(new Float32Array(1), [1]),
            orig_im_size: new Tensor(
                new Float32Array([Math.round(originalHeight * ratio), Math.round(originalWidth * ratio)]),
                [2]
            ),
            point_coords: new Tensor(new Float32Array(pointCoords), [1, pointCoords.length / 2, 2]),
            point_labels: new Tensor(new Float32Array(pointLabels), [1, pointLabels.length]),
        };

        const out = await this.session.run(feeds);
        return { masks: out['masks'], iouPredictions: out['iou_predictions'] };
    }
}
