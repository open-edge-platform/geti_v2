// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

export interface SessionParameters {
    numThreads: number;
    executionProviders: string[];
    wasmRoot?: string | Record<string, string>;
}

function getWasmUrlPath(filename: string): string {
    return new URL(`../../../node_modules/onnxruntime-web/dist/${filename}`, import.meta.url).toString();
}

const wasmPaths = {
    'ort-wasm.wasm': getWasmUrlPath('ort-wasm.wasm'),
    'ort-wasm-simd.wasm': getWasmUrlPath('ort-wasm-simd.wasm'),
    'ort-wasm-threaded.wasm': getWasmUrlPath('ort-wasm-threaded.wasm'),
    'ort-wasm-simd-threaded.wasm': getWasmUrlPath('ort-wasm-simd-threaded.wasm'),
};

export const sessionParams: SessionParameters = {
    numThreads: 0,
    executionProviders: ['cpu'],
    wasmRoot: wasmPaths,
};
