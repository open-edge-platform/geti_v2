// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import type { OpenCVTypes } from '@geti/smart-tools/opencv';

import { SegmentAnythingResult } from './interfaces';
import { OpenCVPreprocessorConfig } from './pre-processing';
import { SegmentAnythingDecoder, SegmentAnythingPrompt } from './segment-anything-decoder';
import { EncodingOutput, SegmentAnythingEncoder } from './segment-anything-encoder';
import { Session, SessionPoisonedError } from './session';

type cv = typeof OpenCVTypes;

// Errors whose message points at the WebGPU / JSEP backend. When we see one
// the right recovery is to drop `webgpu` from the EP list and retry on CPU.
const WEBGPU_ERROR_PATTERN = /webgpu|jsep|wasm|initwasm|no available backend/i;

const isWebGpuFailure = (err: unknown): boolean => {
    if (err instanceof SessionPoisonedError) return true;
    const message = err instanceof Error ? err.message : String(err ?? '');
    return WEBGPU_ERROR_PATTERN.test(message);
};

/**
 * Create a Session, falling back to CPU-only EPs if the first attempt fails
 * with a WebGPU / JSEP initialisation error. Some environments (Tauri WebView,
 * non-cross-origin-isolated tabs, broken GPU drivers) can't load the threaded
 * JSEP wasm; the CPU EP still works there.
 */
const createSession = async (modelPath: string): Promise<Session> => {
    const session = new Session();
    try {
        await session.init(modelPath);
        return session;
    } catch (err) {
        if (!isWebGpuFailure(err)) throw err;

        // Best-effort reset onto CPU. `reset()` reuses the cached model bytes
        // when present; if init() failed before caching them we fall through
        // to a fresh init() with CPU EPs.
        try {
            await session.reset({ executionProviders: ['cpu'] });
            return session;
        } catch {
            const cpuOnly = new Session();
            await cpuOnly.init(modelPath, { executionProviders: ['cpu'] });
            return cpuOnly;
        }
    }
};

export class SegmentAnythingModel {
    private sessions = new Map<string, Session>();
    private modelPaths: Map<string, string>;
    private preProcessorConfig: OpenCVPreprocessorConfig;

    public constructor(
        private cv: cv,
        modelPaths: Map<string, string>,
        preProcessorConfig: OpenCVPreprocessorConfig
    ) {
        this.modelPaths = modelPaths;
        this.preProcessorConfig = preProcessorConfig;
    }

    public async init(algorithm: 'SEGMENT_ANYTHING_DECODER' | 'SEGMENT_ANYTHING_ENCODER'): Promise<void> {
        if (!this.sessions.has('encoder') && algorithm === 'SEGMENT_ANYTHING_ENCODER') {
            const encoderPath = this.modelPaths.get('encoder') ?? '';
            this.sessions.set('encoder', await createSession(encoderPath));
        }

        if (!this.sessions.has('decoder') && algorithm === 'SEGMENT_ANYTHING_DECODER') {
            const decoderPath = this.modelPaths.get('decoder') ?? '';
            this.sessions.set('decoder', await createSession(decoderPath));
        }
    }

    /**
     * Invoke `op` against the given session. On a WebGPU / JSEP failure or a
     * `SessionPoisonedError`, reset the session (downgrading to CPU EPs) and
     * retry exactly once. The retry is the user-visible recovery path: the
     * first call dies, the wrapper transparently recreates the session on the
     * CPU EP, and the caller sees a successful (slower) result.
     */
    private async runWithRecovery<T>(
        sessionKey: 'encoder' | 'decoder',
        op: (session: Session) => Promise<T>
    ): Promise<T> {
        const session = this.sessions.get(sessionKey);
        if (!session) {
            throw Error(`the ${sessionKey} is absent in the sessions map`);
        }

        try {
            return await op(session);
        } catch (err) {
            if (!isWebGpuFailure(err)) throw err;

            // Drop WebGPU on the retry — repeating the same EP after a JSEP
            // crash will almost always fail the same way.
            await session.reset({ executionProviders: ['cpu'] });
            return await op(session);
        }
    }

    public async processEncoder(initialImageData: ImageData): Promise<EncodingOutput> {
        return this.runWithRecovery('encoder', (session) => {
            const encoder = new SegmentAnythingEncoder(this.cv, this.preProcessorConfig, session);
            return encoder.processEncoder(initialImageData);
        });
    }

    public async processDecoder(
        encodingOutput: EncodingOutput,
        input: SegmentAnythingPrompt
    ): Promise<SegmentAnythingResult> {
        const output = await this.runWithRecovery('decoder', (session) => {
            const decoder = new SegmentAnythingDecoder(this.cv, session);
            return decoder.process(encodingOutput, input);
        });

        if (output.shapes.length === 0) {
            return {
                areas: [],
                maxContourIdx: 0,
                shapes: [],
            };
        }

        return {
            areas: [output.areas[output.maxContourIdx]],
            maxContourIdx: output.maxContourIdx,
            shapes: [output.shapes[output.maxContourIdx]],
        };
    }
}
