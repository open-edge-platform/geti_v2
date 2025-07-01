// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import type OpenCVTypes from 'OpenCVTypes';

export interface InferenceImage {
    getImage(imageData: ImageData): OpenCVTypes.Mat;
    resize: (imageData: ImageData, width: number, height: number) => ImageData;
}
