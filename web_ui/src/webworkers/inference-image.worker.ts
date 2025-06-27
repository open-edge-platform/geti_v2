// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { InferenceImage, InferenceImageInstance, OpenCVLoader } from '@geti/smart-tools';
import { expose, proxy, ProxyMarked } from 'comlink';

declare const self: DedicatedWorkerGlobalScope;

const createInferenceImage = async (): Promise<InferenceImageInstance & ProxyMarked> => {
    const opencv = await OpenCVLoader();

    return proxy(new InferenceImage(opencv));
};

const WorkerApi = {
    build: createInferenceImage,
    terminate: self.close,
};

expose(WorkerApi);
