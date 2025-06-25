// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import type OpenCVTypes from 'OpenCVTypes';

let opencv: OpenCVTypes.cv | null = null;

const OpenCVLoader = async (): Promise<boolean> => {
    if (opencv) return true;

    const cv = await import('../opencv/4.9.0/opencv.js');

    if ('ready' in cv) await cv.ready;

    opencv = cv;

    return true;
};

export { OpenCVLoader, opencv };
