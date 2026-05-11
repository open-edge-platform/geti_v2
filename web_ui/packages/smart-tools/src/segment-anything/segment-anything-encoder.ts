// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import type { OpenCVTypes } from '@geti/smart-tools/opencv';
import { Tensor } from 'onnxruntime-web';

import { OpenCVPreprocessor, OpenCVPreprocessorConfig } from './pre-processing';
import { type Session } from './session';

type cv = typeof OpenCVTypes;

// A plain-object representation of ort.Tensor that survives structured-clone
// (Comlink transfers between workers). ort.Tensor instances lose their class
// identity and `location` property when cloned, causing onnxruntime >=1.20 to
// throw "invalid data location: undefined".
export type SerializableTensor = {
    data: Float32Array;
    dims: number[];
    type: Tensor.Type;
};

export type EncodingOutput = {
    encoderResult: SerializableTensor;
    originalWidth: number;
    originalHeight: number;
    newWidth: number;
    newHeight: number;
};

export class SegmentAnythingEncoder {
    private preprocessor: OpenCVPreprocessor;

    constructor(
        cv: cv,
        config: OpenCVPreprocessorConfig,
        private session: Session
    ) {
        this.preprocessor = new OpenCVPreprocessor(cv, config);
    }

    public async processEncoder(initialImageData: ImageData): Promise<EncodingOutput> {
        const { tensor, newWidth, newHeight } = this.preprocessor.process(initialImageData);
        const outputData = await this.session.run({ x: tensor });
        const outputNames = await this.session.outputNames();
        const gpuTensor = outputData[outputNames[0]];

        return {
            encoderResult: {
                data: (await gpuTensor.getData()) as Float32Array,
                dims: [...gpuTensor.dims],
                type: gpuTensor.type as Tensor.Type,
            },
            originalWidth: initialImageData.width,
            originalHeight: initialImageData.height,
            newWidth,
            newHeight,
        };
    }
}
