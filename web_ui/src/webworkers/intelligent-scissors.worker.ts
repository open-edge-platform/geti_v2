// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { buildIntelligentScissorsInstance } from '@geti/smart-tools';
import { expose, proxy } from 'comlink';

const WorkerApi = {
    build: async () => {
        const instance = await buildIntelligentScissorsInstance();

        return proxy(instance);
    },
};

expose(WorkerApi);
