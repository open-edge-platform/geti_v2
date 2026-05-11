// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import type { OpenCVTypes } from '../opencv/interfaces';
import { OpenCVLoader } from '../utils/opencv-loader';
import { SegmentAnythingResult } from './interfaces';
import { SegmentAnythingModels } from './models/models';
import { OpenCVPreprocessorConfig } from './pre-processing';
import { SegmentAnythingModel } from './segment-anything';
import { SegmentAnythingPrompt } from './segment-anything-decoder';
import { EncodingOutput } from './segment-anything-encoder';

const PRE_PROCESSOR_CONFIG: OpenCVPreprocessorConfig = {
    normalize: {
        mean: [0.485, 0.456, 0.406],
        std: [0.229, 0.224, 0.225],
    },
    resize: true,
    size: 1024,
    squareImage: false,
    pad: true,
    padSize: 1024,
};

const MODEL_PATHS = new Map([
    ['encoder', SegmentAnythingModels.encoder],
    ['decoder', SegmentAnythingModels.decoder],
]);

class SegmentAnythingModelWrapper {
    private model: SegmentAnythingModel;

    constructor(CV: OpenCVTypes.cv) {
        this.model = new SegmentAnythingModel(CV, MODEL_PATHS, PRE_PROCESSOR_CONFIG);
    }

    public init(algorithm: 'SEGMENT_ANYTHING_DECODER' | 'SEGMENT_ANYTHING_ENCODER'): Promise<void> {
        return this.model.init(algorithm);
    }

    public processEncoder(initialImageData: ImageData): Promise<EncodingOutput> {
        return this.model.processEncoder(initialImageData);
    }

    public processDecoder(
        encodingOutput: EncodingOutput,
        input: SegmentAnythingPrompt
    ): Promise<SegmentAnythingResult> {
        return this.model.processDecoder(encodingOutput, input);
    }
}

const buildSegmentAnythingInstance = async (): Promise<SegmentAnythingModelWrapper> => {
    return new SegmentAnythingModelWrapper(await OpenCVLoader());
};

export { buildSegmentAnythingInstance, SegmentAnythingModelWrapper };
