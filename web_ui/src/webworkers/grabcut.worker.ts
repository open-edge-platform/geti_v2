// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { buildGrabcutInstance } from '@geti/smart-tools';
import { expose, proxy } from 'comlink';

const WorkerApi = {
    build: async () => {
        const instance = await buildGrabcutInstance();

        return proxy(instance);
    },
};

expose(WorkerApi);
