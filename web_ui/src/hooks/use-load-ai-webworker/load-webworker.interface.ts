// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { InferenceImage, SSIM, Watershed } from '@geti/smart-tools';

import { InferenceImageWorker } from '../../pages/annotator/components/explanation/inference-image.interface';
import { GrabcutInstance, GrabcutWorker } from '../../pages/annotator/tools/grabcut-tool/grabcut-tool.interface';
import {
    IntelligentScissorsInstance,
    IntelligentScissorsWorker,
} from '../../pages/annotator/tools/polygon-tool/polygon-tool.interface';
import { RITMMethods, RITMWorker } from '../../pages/annotator/tools/ritm-tool/ritm-tool.interface';
import { SegmentAnythingModel } from '../../pages/annotator/tools/segment-anything-tool/model/segment-anything';
import {
    SegmentAnythingDecoderWorker,
    SegmentAnythingEncoderWorker,
} from '../../pages/annotator/tools/segment-anything-tool/segment-anything.interface';
import { SSIMWorker } from '../../pages/annotator/tools/ssim-tool/ssim-tool.interface';
import { WatershedWorker } from '../../pages/annotator/tools/watershed-tool/watershed-tool.interface';
import { AlgorithmType } from './algorithm.interface';

export type GetiWorker =
    | GrabcutWorker
    | WatershedWorker
    | IntelligentScissorsWorker
    | RITMWorker
    | SSIMWorker
    | InferenceImageWorker
    | SegmentAnythingEncoderWorker
    | SegmentAnythingDecoderWorker;

export type MapAlgorithmToWorker = {
    // E.g. [AlgorithmType.GRABCUT]: GrabcutWorker
    [K in AlgorithmType]: Extract<GetiWorker, { type: K }>;
};

// TODO: We will use this once all tools are moved
export type MapAlgorithmToInstance = {
    [AlgorithmType.WATERSHED]: Watershed;
    [AlgorithmType.GRABCUT]: GrabcutInstance;
    [AlgorithmType.INTELLIGENT_SCISSORS]: IntelligentScissorsInstance;
    [AlgorithmType.RITM]: RITMMethods;
    [AlgorithmType.SSIM]: SSIM;
    [AlgorithmType.INFERENCE_IMAGE]: InferenceImage;
    [AlgorithmType.SEGMENT_ANYTHING_ENCODER]: SegmentAnythingModel;
    [AlgorithmType.SEGMENT_ANYTHING_DECODER]: SegmentAnythingModel;
};
