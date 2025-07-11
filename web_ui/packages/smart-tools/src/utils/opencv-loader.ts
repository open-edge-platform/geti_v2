// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import type OpenCVTypes from 'OpenCVTypes';

let opencv: OpenCVTypes.cv | null = null;

export const OpenCVLoader = async (): Promise<OpenCVTypes.cv> => {
    if (opencv) return opencv;

    const cv: OpenCVTypes.cv = await import('../opencv/4.9.0/opencv.js');

    if ('ready' in cv) await cv.ready;

    opencv = cv;

    return opencv;
};
