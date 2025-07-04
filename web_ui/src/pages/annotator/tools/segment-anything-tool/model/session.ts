// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { loadSource, SessionParameters, sessionParams } from '@geti/smart-tools';
import { env, InferenceSession } from 'onnxruntime-web';

const loadModel = async (modelPath: string) => {
    return await (await loadSource(modelPath))?.arrayBuffer();
};

export class Session {
    ortSession: InferenceSession | undefined;
    params: SessionParameters;

    constructor() {
        this.params = sessionParams;
    }

    public async init(modelPath: string) {
        env.wasm.numThreads = this.params.numThreads;
        env.wasm.wasmPaths = this.params.wasmRoot;
        env.wasm.simd = true;

        const modelData = await loadModel(modelPath);

        if (!modelData) {
            throw new Error(`Unable to load model from "${modelPath}"`);
        }

        const session = await InferenceSession.create(modelData, {
            executionProviders: this.params.executionProviders,
            graphOptimizationLevel: 'all',
            executionMode: 'parallel',
        });

        this.ortSession = session;
    }

    public async run(input: InferenceSession.OnnxValueMapType): Promise<InferenceSession.OnnxValueMapType> {
        if (!this.ortSession) {
            throw Error('the session is not initialized. Call `init()` method first.');
        }
        return await this.ortSession.run(input);
    }

    public inputNames(): readonly string[] {
        if (!this.ortSession) {
            throw Error('the session is not initialized. Call `init()` method first.');
        }
        return this.ortSession.inputNames;
    }

    public outputNames(): readonly string[] {
        if (!this.ortSession) {
            throw Error('the session is not initialized. Call `init()` method first.');
        }
        return this.ortSession.outputNames;
    }
}
