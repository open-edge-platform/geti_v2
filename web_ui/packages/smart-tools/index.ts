// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

export { buildWatershedInstance, Watershed } from './src/watershed/watershed';
export { type WatershedPolygon } from './src/watershed/interfaces';

export { buildInferenceImageInstance, InferenceImage } from './src/inference-image/inference-image';

export { buildSSIMInstance, SSIM } from './src/ssim/ssim';
export { type RunSSIMProps, type SSIMMatch } from './src/ssim/interfaces';

export { buildGrabcutInstance, Grabcut } from './src/grabcut/grabcut';
export { type GrabcutData } from './src/grabcut/interfaces';

export { buildIntelligentScissorsInstance, IntelligentScissors } from './src/intelligent-scissors/intelligent-scissors';

export {
    buildSegmentAnythingInstance,
    SegmentAnythingModelWrapper as SegmentAnythingModel,
} from './src/segment-anything/segment-anything-wrapper';
export type { EncodingOutput } from './src/segment-anything/segment-anything-encoder';
