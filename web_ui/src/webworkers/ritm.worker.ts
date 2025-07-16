// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { buildRITMInstance } from '@geti/smart-tools/ritm';
import { expose, proxy } from 'comlink';

const WorkerApi = {
    build: async () => {
        const instance = await buildRITMInstance();

        return proxy(instance);
    },
};

expose(WorkerApi);
