// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { InferenceImageInstance } from '@geti/smart-tools';

import { AlgorithmType } from '../../../../hooks/use-load-ai-webworker/algorithm.interface';
import { WebWorker } from '../../../../webworkers/web-worker.interface';

export interface InferenceImageWorker extends WebWorker {
    build: () => Promise<InferenceImageInstance>;
    type: AlgorithmType.INFERENCE_IMAGE;
}
