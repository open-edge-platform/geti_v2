// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { OpenCVLoader } from '@geti/smart-tools';
import type OpenCVTypes from 'OpenCVTypes';

let opencv: OpenCVTypes.cv | null = null;

export const waitForOpenCV = async (): Promise<OpenCVTypes.cv> => {
    if (opencv) return true;

    opencv = await OpenCVLoader();

    if ('ready' in opencv) {
        await opencv.ready;
    }

    return false;
};
