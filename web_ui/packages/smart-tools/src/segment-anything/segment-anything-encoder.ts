// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import type { OpenCVTypes } from '@geti/smart-tools/opencv';
import type * as Comlink from 'comlink';
import { Tensor } from 'onnxruntime-web';

import { OpenCVPreprocessor, OpenCVPreprocessorConfig } from './pre-processing';
import { type Session } from './session';

type cv = typeof OpenCVTypes;

type ModelSession = Session | Comlink.Remote<Session>;

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
        private session: ModelSession
    ) {
        this.preprocessor = new OpenCVPreprocessor(cv, config);
    }

    public async processEncoder(initialImageData: ImageData) {
        const result = this.preprocessor.process(initialImageData);
        console.time('[SAM] Encoding');
        const outputData = await this.session.run({ x: result.tensor });
        console.timeEnd('[SAM] Encoding');

        const outputNames = await this.session.outputNames();
        const gpuTensor = outputData[outputNames[0]];

        // ort.Tensor instances lose their class identity (and `location` getter)
        // when structured-cloned by Comlink across workers, causing onnxruntime
        // >=1.20 to throw "invalid data location: undefined". Store raw typed
        // array data so the decoder can reconstruct a valid tensor.
        const encoderResult: SerializableTensor = {
            data: (await gpuTensor.getData()) as Float32Array,
            dims: [...gpuTensor.dims],
            type: gpuTensor.type as Tensor.Type,
        };

        const originalWidth = initialImageData.width;
        const originalHeight = initialImageData.height;
        const newWidth = result.newWidth;
        const newHeight = result.newHeight;

        return {
            encoderResult,
            originalWidth,
            originalHeight,
            newWidth,
            newHeight,
        };
    }
}
