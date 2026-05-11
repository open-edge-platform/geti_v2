// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

export interface SessionParameters {
    numThreads: number;
    executionProviders: string[];
    wasmRoot: { wasm: string };
}

const wasmPaths = {
    wasm: new URL(
        '../../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm',
        import.meta.url
    ).toString(),
};

/**
 * The threaded JSEP wasm needs `SharedArrayBuffer`, which in turn needs
 * cross-origin isolation (COOP/COEP). Tauri's WebView and any non-isolated
 * browser context don't satisfy that, so `pthread_create` fails when ORT
 * tries to spin up its worker pool. Once `initWasm()` fails ORT caches the
 * failure globally and even the CPU EP fallback rejects with
 * "previous call to 'initWasm()' failed".
 *
 * Detect that environment up front: force single-threaded wasm and drop the
 * `webgpu` EP (its kernels require the threaded wasm). Browsers with proper
 * isolation keep the multi-threaded WebGPU path.
 */
const hasThreadedWasmSupport = (): boolean => {
    try {
        return (
            typeof SharedArrayBuffer !== 'undefined' &&
            typeof globalThis !== 'undefined' &&
            // `crossOriginIsolated` is the canonical signal; absent in Tauri WebView.
            (globalThis as { crossOriginIsolated?: boolean }).crossOriginIsolated === true
        );
    } catch {
        return false;
    }
};

const threaded = hasThreadedWasmSupport();

export const sessionParams: SessionParameters = {
    // `0` lets ORT pick `navigator.hardwareConcurrency`. Force `1` when we
    // can't spawn workers so ORT skips pthread_create entirely.
    numThreads: threaded ? 0 : 1,
    executionProviders: threaded ? ['webgpu', 'cpu'] : ['cpu'],
    wasmRoot: wasmPaths,
};
