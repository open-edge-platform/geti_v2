// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { OpenCVLoader, Watershed, WatershedInstance } from '@geti/smart-tools';
import { expose, proxy, ProxyMarked } from 'comlink';

declare const self: DedicatedWorkerGlobalScope;

const initWatershed = async (): Promise<WatershedInstance & ProxyMarked> => {
    const opencv = await OpenCVLoader();

    return proxy(new Watershed(opencv));
};

const WorkerApi = {
    build: initWatershed,
    terminate: self.close,
};

expose(WorkerApi);
