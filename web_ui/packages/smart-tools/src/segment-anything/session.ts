// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { env, InferenceSession } from 'onnxruntime-web';

import { loadSource } from '../utils/tool-utils';
import { SessionParameters, sessionParams } from '../utils/wasm-utils';

const loadModel = async (modelPath: string) => {
    return await (await loadSource(modelPath))?.arrayBuffer();
};

export class Session {
    ortSession: InferenceSession | undefined;
    params: SessionParameters;
    private runQueue: Promise<void> = Promise.resolve();

    constructor() {
        this.params = sessionParams;
    }

    public async init(modelPath: string) {
        env.wasm.numThreads = this.params.numThreads;
        env.wasm.wasmPaths = this.params.wasmRoot;
        env.wasm.simd = true;
        // Suppress expected "some nodes not assigned to WebGPU EP" warnings —
        // ORT intentionally keeps shape-related ops on CPU for performance.
        env.logLevel = 'error';

        const modelData = await loadModel(modelPath);

        if (!modelData) {
            throw new Error(`Unable to load model from "${modelPath}"`);
        }

        const session = await InferenceSession.create(modelData, {
            executionProviders: this.params.executionProviders,
            graphOptimizationLevel: 'all',
            executionMode: 'parallel',
            // 0=verbose, 1=info, 2=warning, 3=error, 4=fatal. Silences the
            // native "VerifyEachNodeIsAssignedToAnEp" warnings emitted when
            // ORT intentionally keeps shape-related ops on the CPU EP.
            logSeverityLevel: 3,
        });

        this.ortSession = session;
    }

    public async run(input: InferenceSession.OnnxValueMapType): Promise<InferenceSession.OnnxValueMapType> {
        if (!this.ortSession) {
            throw Error('the session is not initialized. Call `init()` method first.');
        }
        // onnxruntime-web does not support concurrent run() calls on the same session.
        // Serialize calls through a void queue so the result type stays clean.
        const runNext = this.runQueue.then(() => this.ortSession!.run(input));
        this.runQueue = runNext.then(
            () => undefined,
            () => undefined
        );
        return runNext;
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
