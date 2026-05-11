// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { env, InferenceSession } from 'onnxruntime-web';

import { loadSource } from '../utils/tool-utils';
import { SessionParameters, sessionParams } from '../utils/wasm-utils';

const loadModel = async (modelPath: string) => {
    return await (await loadSource(modelPath))?.arrayBuffer();
};

/**
 * Default per-call timeout (ms) applied when neither `init()` nor `run()`
 * specifies one. Sized to bound a hung `ortSession.run()` (e.g. JSEP/WebGPU
 * stall, native deadlock) without false-firing on a legitimate slow SAM
 * encoder pass on a CPU EP, which can comfortably take 30–60 s on modest
 * hardware. Override via `init({ runTimeoutMs })` or `run({ timeoutMs })`;
 * pass `0` to disable.
 */
export const DEFAULT_RUN_TIMEOUT_MS = 5 * 60_000;

/**
 * Thrown when a single `Session.run()` call exceeds its configured timeout.
 * The session is marked unhealthy after this — call `Session.reset()` to revive it.
 */
export class SessionRunTimeoutError extends Error {
    constructor(timeoutMs: number) {
        super(`ortSession.run() did not complete within ${timeoutMs}ms`);
        this.name = 'SessionRunTimeoutError';
    }
}

/**
 * Thrown by `Session.run()` when a previous call left the underlying
 * InferenceSession in an unrecoverable state (WASM heap corruption, EP stall, ...).
 * The caller should call `Session.reset()` (optionally downgrading the EP) before
 * issuing more runs.
 */
export class SessionPoisonedError extends Error {
    constructor() {
        super('Session is poisoned after a previous unrecoverable failure. Call Session.reset() to revive it.');
        this.name = 'SessionPoisonedError';
    }
}

export interface SessionInitOptions {
    /**
     * Override the default execution providers (e.g. `['cpu']` to force CPU on
     * platforms where WebGPU is unavailable or broken).
     */
    executionProviders?: SessionParameters['executionProviders'];
    /**
     * Default timeout (ms) applied to every `run()` call unless overridden per-call.
     * `0` or `undefined` disables the timeout.
     */
    runTimeoutMs?: number;
}

export interface SessionRunOptions {
    /** Per-call timeout (ms) overriding the session-level default. */
    timeoutMs?: number;
}

export class Session {
    ortSession: InferenceSession | undefined;
    params: SessionParameters;
    // Tail of the serial run() queue. onnxruntime-web doesn't support
    // concurrent run() calls on the same session, so each run waits for
    // the previous one. `unknown` lets us chain without type-juggling.
    private pending: Promise<unknown> = Promise.resolve();
    // Cached model bytes so reset() can recreate the InferenceSession without
    // re-downloading. Kept until the Session is discarded.
    private modelData: ArrayBuffer | undefined;
    private executionProviders: SessionParameters['executionProviders'];
    private runTimeoutMs: number | undefined;
    private poisoned = false;
    // Bumped on every reset() and on poisoning. Captured by run() at enqueue
    // time and re-checked inside the queued continuation so that calls already
    // sitting behind a poisoned/replaced session are rejected instead of
    // executing against a stale or corrupted ortSession.
    private generation = 0;

    constructor() {
        this.params = sessionParams;
        this.executionProviders = sessionParams.executionProviders;
    }

    /**
     * `true` while the underlying ortSession is created and no unrecoverable
     * failure (thrown error or timeout) has been observed since.
     */
    public get isHealthy(): boolean {
        return !this.poisoned && this.ortSession !== undefined;
    }

    public async init(modelPath: string, options?: SessionInitOptions): Promise<void> {
        this.executionProviders = options?.executionProviders ?? this.params.executionProviders;
        // Default to a non-zero timeout so callers that omit `runTimeoutMs`
        // are still protected from a hung run() blocking the serial queue.
        // Explicit `0` disables the timeout.
        this.runTimeoutMs = options?.runTimeoutMs ?? DEFAULT_RUN_TIMEOUT_MS;

        const modelData = await loadModel(modelPath);

        if (!modelData) {
            throw new Error(`Unable to load model from "${modelPath}"`);
        }

        this.modelData = modelData;
        await this.createOrtSession();
    }

    /**
     * Recreate the underlying InferenceSession from the cached model bytes,
     * after a poisoning failure (WASM OOB, JSEP kernel crash, EP hang, ...).
     * Reuses the model bytes captured during `init()` — no re-download.
     *
     * Pass `executionProviders` to downgrade after repeated WebGPU failures
     * (e.g. `{ executionProviders: ['cpu'] }`). Without it the previously
     * configured EPs are reused.
     */
    public async reset(options?: SessionInitOptions): Promise<void> {
        if (!this.modelData) {
            throw new Error('Session.reset() called before init(); no model bytes cached.');
        }

        if (options?.executionProviders) {
            this.executionProviders = options.executionProviders;
        }
        if (options?.runTimeoutMs !== undefined) {
            this.runTimeoutMs = options.runTimeoutMs;
        }

        // Best-effort release of the dead session — the WASM heap may already
        // be corrupt, so swallow any error from release().
        const previous = this.ortSession;
        this.ortSession = undefined;
        if (previous && typeof previous.release === 'function') {
            try {
                await previous.release();
            } catch {
                // ignore — session is going away anyway
            }
        }

        // Drop any chained-but-never-resolved tail (e.g. a hung run()) and
        // invalidate any run() calls that are already queued — they captured
        // the previous generation and must not execute against the new
        // session.
        this.pending = Promise.resolve();
        this.generation++;
        this.poisoned = false;

        await this.createOrtSession();
    }

    private async createOrtSession(): Promise<void> {
        // The threaded JSEP wasm needs SharedArrayBuffer / cross-origin
        // isolation. When we're running CPU-only (either by config or after
        // a WebGPU/JSEP downgrade) force single-threaded wasm so ORT skips
        // pthread_create entirely — once `initWasm()` fails it stays failed
        // for the lifetime of the page and even pure-CPU sessions reject
        // with "previous call to 'initWasm()' failed".
        const cpuOnly = this.executionProviders.length === 1 && this.executionProviders[0] === 'cpu';
        env.wasm.numThreads = cpuOnly ? 1 : this.params.numThreads;
        env.wasm.wasmPaths = this.params.wasmRoot;
        env.wasm.simd = true;
        // Suppress expected "some nodes not assigned to WebGPU EP" warnings —
        // ORT intentionally keeps shape-related ops on CPU for performance.
        env.logLevel = 'error';

        this.ortSession = await InferenceSession.create(this.modelData as ArrayBuffer, {
            executionProviders: this.executionProviders,
            graphOptimizationLevel: 'all',
            executionMode: 'parallel',
            // 0=verbose, 1=info, 2=warning, 3=error, 4=fatal. Silences the
            // native "VerifyEachNodeIsAssignedToAnEp" warnings emitted when
            // ORT intentionally keeps shape-related ops on the CPU EP.
            logSeverityLevel: 3,
        });
    }

    public async run(
        input: InferenceSession.OnnxValueMapType,
        options?: SessionRunOptions
    ): Promise<InferenceSession.OnnxValueMapType> {
        if (!this.ortSession) {
            throw Error('the session is not initialized. Call `init()` method first.');
        }
        if (this.poisoned) {
            throw new SessionPoisonedError();
        }

        const timeoutMs = options?.timeoutMs ?? this.runTimeoutMs;
        // Snapshot the session generation at enqueue time. If poisoning or a
        // reset() bumps it before our turn arrives, we must refuse to run
        // against the stale/corrupted (or now-replaced) ortSession.
        const enqueuedGeneration = this.generation;

        // Wait for our turn but never propagate a previous failure to this call.
        const waitForTurn = this.pending.catch(() => undefined);
        const next = waitForTurn.then(() => {
            // Re-validate just before invoking ortSession.run(): an earlier
            // queued call may have poisoned the session, or reset() may have
            // replaced it entirely while we were waiting.
            if (this.poisoned || this.generation !== enqueuedGeneration) {
                throw new SessionPoisonedError();
            }

            const currentSession = this.ortSession;
            if (!currentSession) {
                throw new SessionPoisonedError();
            }

            return this.runOnce(currentSession, input, timeoutMs);
        });

        // Always advance the queue, regardless of whether `next` resolves or
        // rejects (incl. timeout). Without `.catch(...)` here a hung run()
        // would leave every subsequent caller chained behind a never-settling
        // promise.
        this.pending = next.catch(() => undefined);

        return next;
    }

    private runOnce(
        session: InferenceSession,
        input: InferenceSession.OnnxValueMapType,
        timeoutMs: number | undefined
    ): Promise<InferenceSession.OnnxValueMapType> {
        const runPromise = session.run(input);

        if (!timeoutMs || timeoutMs <= 0) {
            return runPromise.catch((err) => {
                // Any thrown error from ortSession.run() is treated as
                // unrecoverable — JSEP failures leave the WASM heap in an
                // inconsistent state and subsequent runs OOB or return garbage.
                this.poison();
                throw err;
            });
        }

        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
                this.poison();
                reject(new SessionRunTimeoutError(timeoutMs));
            }, timeoutMs);
        });

        return Promise.race([runPromise, timeoutPromise]).then(
            (result) => {
                if (timer !== undefined) clearTimeout(timer);
                return result;
            },
            (err) => {
                if (timer !== undefined) clearTimeout(timer);
                this.poison();
                throw err;
            }
        );
    }

    private poison(): void {
        if (this.poisoned) return;
        this.poisoned = true;
        // Bump the generation so any run() calls already queued behind this
        // one are rejected in their `then(...)` re-check instead of executing
        // against the now-corrupted session.
        this.generation++;
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
