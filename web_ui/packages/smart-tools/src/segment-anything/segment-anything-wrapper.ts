// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { OpenCVTypes } from '../opencv/interfaces';
import { OpenCVLoader } from '../utils/opencv-loader';
import { SegmentAnythingResult } from './interfaces';
import { SegmentAnythingModels } from './models/models';
import { SegmentAnythingModel } from './segment-anything';
import { SegmentAnythingPrompt } from './segment-anything-decoder';
import { EncodingOutput } from './segment-anything-encoder';

class SegmentAnythingModelWrapper {
    private model: SegmentAnythingModel;

    constructor(private CV: OpenCVTypes.cv) {
        const config = {
            preProcessorConfig: {
                normalize: {
                    enabled: true,
                    mean: [0.485, 0.456, 0.406],
                    std: [0.229, 0.224, 0.225],
                },
                resize: true,
                size: 1024,
                squareImage: false,
                pad: true,
                padSize: 1024,
            },
            modelPaths: new Map([
                ['encoder', SegmentAnythingModels.encoder],
                ['decoder', SegmentAnythingModels.decoder],
            ]),
        };

        this.model = new SegmentAnythingModel(this.CV, config.modelPaths, config.preProcessorConfig);
    }

    public async init(algorithm: 'SEGMENT_ANYTHING_DECODER' | 'SEGMENT_ANYTHING_ENCODER'): Promise<void> {
        await this.model.init(algorithm);
    }
    public async processEncoder(initialImageData: ImageData): Promise<EncodingOutput> {
        return this.model.processEncoder(initialImageData);
    }

    public async processDecoder(
        encodingOutput: EncodingOutput,
        input: SegmentAnythingPrompt
    ): Promise<SegmentAnythingResult> {
        return this.model.processDecoder(encodingOutput, input);
    }
}

const buildSegmentAnythingInstance = async (): Promise<SegmentAnythingModelWrapper> => {
    const opencv = await OpenCVLoader();

    return new SegmentAnythingModelWrapper(opencv);
};

export { buildSegmentAnythingInstance, SegmentAnythingModelWrapper };
