// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import type OpenCVTypes from 'OpenCVTypes';

import OpenCVLoader from './opencv-loader';

let opencv: OpenCVTypes.cv | null = null;

export const waitForOpenCV = async (): Promise<boolean> => {
    if (opencv) return true;

    opencv = await OpenCVLoader();

    if ('ready' in opencv) {
        await opencv.ready;
    }

    return false;
};
