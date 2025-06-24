// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { waitForOpenCV, Watershed, WatershedInstance } from '@geti/smart-tools';
import { expose, proxy, ProxyMarked } from 'comlink';

declare const self: DedicatedWorkerGlobalScope;

const initWatershed = async (imageData: ImageData): Promise<WatershedInstance & ProxyMarked> => {
    const opencv = await waitForOpenCV();

    return proxy(new Watershed(opencv, imageData));
};

const WorkerApi = {
    Watershed: initWatershed,
    terminate: self.close,
    waitForOpenCV,
};

expose(WorkerApi);
