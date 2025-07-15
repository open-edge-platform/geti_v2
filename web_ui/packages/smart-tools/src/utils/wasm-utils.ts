// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

export interface SessionParameters {
    numThreads: number;
    executionProviders: string[];
    wasmRoot?: Promise<string | Record<string, string>>;
}

const getWasmPaths = async () => {
    if (process.env.NODE_ENV === 'test') {
        return {};
    }

    return (await import('./wasm-paths')).wasmPaths;
};

export const sessionParams: SessionParameters = {
    numThreads: 0,
    executionProviders: ['cpu'],
    wasmRoot: getWasmPaths(),
};
