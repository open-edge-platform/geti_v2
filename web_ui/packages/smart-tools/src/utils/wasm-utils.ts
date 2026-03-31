// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

export interface SessionParameters {
    numThreads: number;
    executionProviders: string[];
    wasmRoot?: string | { wasm?: string };
}

const wasmPaths = {
    wasm: new URL(
        '../../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm',
        import.meta.url
    ).toString(),
};

export const sessionParams: SessionParameters = {
    numThreads: 0,
    executionProviders: ['webgpu', 'cpu'],
    wasmRoot: wasmPaths,
};
