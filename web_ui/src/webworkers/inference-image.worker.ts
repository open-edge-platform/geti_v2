// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { buildInferenceImageInstance } from '@geti/smart-tools';
import { expose, proxy } from 'comlink';

declare const self: DedicatedWorkerGlobalScope;

const WorkerApi = {
    build: async () => {
        const instance = await buildInferenceImageInstance();

        return proxy(instance);
    },
    terminate: self.close,
};

expose(WorkerApi);
