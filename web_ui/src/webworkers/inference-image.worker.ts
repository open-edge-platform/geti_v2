// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { InferenceImage, opencv, OpenCVLoader } from '@geti/smart-tools';
import { expose, proxy, ProxyMarked } from 'comlink';

declare const self: DedicatedWorkerGlobalScope;

const createInferenceImage = async (): Promise<ProxyMarked> => {
    return proxy(new InferenceImage(opencv));
};

const WorkerApi = { InferenceImage: createInferenceImage, loadOpenCV: OpenCVLoader, terminate: self.close };

expose(WorkerApi);
