// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { InferenceImage, waitForOpenCV } from '@geti/smart-tools';
import { expose } from 'comlink';

declare const self: DedicatedWorkerGlobalScope;

const WorkerApi = { InferenceImage, waitForOpenCV, terminate: self.close };

expose(WorkerApi);
