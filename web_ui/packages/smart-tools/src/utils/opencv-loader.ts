// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import type { OpenCVTypes } from '../opencv/interfaces';

let opencv: OpenCVTypes | null = null;

export const OpenCVLoader = async (): Promise<OpenCVTypes> => {
    if (opencv) return opencv;

    const cv: OpenCVTypes = await import('../opencv/4.9.0/opencv.js');

    if ('ready' in cv) await cv.ready;

    opencv = cv;

    return opencv;
};
