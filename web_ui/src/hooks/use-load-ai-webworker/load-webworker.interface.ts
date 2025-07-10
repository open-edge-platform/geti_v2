// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Grabcut, InferenceImage, IntelligentScissors, SegmentAnythingModel, SSIM, Watershed } from '@geti/smart-tools';
import { RITM } from '@geti/smart-tools/ritm';
import { Remote } from 'comlink';

import { AlgorithmType } from './algorithm.interface';

export interface BaseWorker<T> {
    build: () => Promise<Remote<T>>;
    type: AlgorithmType;
}

export type MapAlgorithmToInstance = {
    [AlgorithmType.WATERSHED]: Watershed;
    [AlgorithmType.GRABCUT]: Grabcut;
    [AlgorithmType.INTELLIGENT_SCISSORS]: IntelligentScissors;
    [AlgorithmType.RITM]: RITM;
    [AlgorithmType.SSIM]: SSIM;
    [AlgorithmType.INFERENCE_IMAGE]: InferenceImage;
    [AlgorithmType.SEGMENT_ANYTHING_ENCODER]: SegmentAnythingModel;
    [AlgorithmType.SEGMENT_ANYTHING_DECODER]: SegmentAnythingModel;
};
