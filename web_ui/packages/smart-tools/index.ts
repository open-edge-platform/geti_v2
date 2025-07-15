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

// TODO: To be moved to SegmentAnything folder on the next PRs
export const SegmentAnythingModels = {
    encoder: new URL('./src/segment-anything/models/mobile_sam.encoder.onnx', import.meta.url).toString(),
    decoder: new URL('./src/segment-anything/models/sam_vit_h_4b8939.decoder.onnx', import.meta.url).toString(),
};

export { sessionParams, type SessionParameters } from './src/utils/wasm-utils';
