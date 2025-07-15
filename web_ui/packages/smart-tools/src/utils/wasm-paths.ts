// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

export const wasmPaths = {
    'ort-wasm.wasm': new URL('../../../../node_modules/onnxruntime-web/dist/ort-wasm.wasm', import.meta.url).toString(),
    'ort-wasm-simd.wasm': new URL(
        '../../../../node_modules/onnxruntime-web/dist/ort-wasm-simd.wasm',
        import.meta.url
    ).toString(),
    'ort-wasm-threaded.wasm': new URL(
        '../../../../node_modules/onnxruntime-web/dist/ort-wasm-threaded.wasm',
        import.meta.url
    ).toString(),
    'ort-wasm-simd-threaded.wasm': new URL(
        '../../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm',
        import.meta.url
    ).toString(),
};
