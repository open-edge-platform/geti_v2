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
 * Build a fresh Session pinned to the CPU EP. Used as the last-resort recovery
 * path whenever an existing Session is too damaged to reset() (e.g.
 * createOrtSession threw on the new EP, leaving `ortSession === undefined`).
 */
const createCpuSession = async (modelPath: string): Promise<Session> => {
    const session = new Session();
    await session.init(modelPath, { executionProviders: ['cpu'] });
    return session;
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
            return createCpuSession(modelPath);
        }
    }
};

export class SegmentAnythingModel {
    private sessions = new Map<string, Session>();

    public constructor(
        private cv: cv,
        private modelPaths: Map<string, string>,
        private preProcessorConfig: OpenCVPreprocessorConfig
    ) {}

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
            try {
                await session.reset({ executionProviders: ['cpu'] });
            } catch {
                // reset() failed (e.g. createOrtSession threw on the CPU EP).
                // The Session is now wedged with `ortSession === undefined`,
                // so every future run() would throw "session not initialized"
                // for the rest of the page's lifetime. Replace the entry in
                // the map with a fresh CPU-only Session so subsequent calls
                // recover.
                const replacement = await createCpuSession(this.modelPaths.get(sessionKey) ?? '');

                this.sessions.set(sessionKey, replacement);

                return await op(replacement);
            }
            return await op(session);
        }
    }

    public async processEncoder(initialImageData: ImageData): Promise<EncodingOutput> {
        return this.runWithRecovery('encoder', (session) =>
            new SegmentAnythingEncoder(this.cv, this.preProcessorConfig, session).processEncoder(initialImageData)
        );
    }

    public async processDecoder(
        encodingOutput: EncodingOutput,
        input: SegmentAnythingPrompt
    ): Promise<SegmentAnythingResult> {
        const { shapes, areas, maxContourIdx } = await this.runWithRecovery('decoder', (session) =>
            new SegmentAnythingDecoder(this.cv, session).process(encodingOutput, input)
        );

        if (shapes.length === 0) {
            return { shapes: [], areas: [], maxContourIdx: 0 };
        }

        return {
            shapes: [shapes[maxContourIdx]],
            areas: [areas[maxContourIdx]],
            maxContourIdx,
        };
    }
}
