// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { InferenceImage, OpenCVLoader } from '@geti/smart-tools';
import { expose } from 'comlink';
import type OpenCVTypes from 'OpenCVTypes';

declare const self: DedicatedWorkerGlobalScope;

let opencv: OpenCVTypes;

const waitForOpenCV = async () => {
    if (opencv) return true;

    opencv = await OpenCVLoader();

    if ('ready' in opencv) {
        await opencv.ready;
    }

    return false;
};

const WorkerApi = { InferenceImage, waitForOpenCV, terminate: self.close };

expose(WorkerApi);
