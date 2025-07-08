// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { LegacySupportedAlgorithm } from '../supported-algorithms.interface';
import { SupportedAlgorithmsService } from './supported-algorithms.interface';
import { mockedSupportedAlgorithms } from './test-utils';

export const createInMemorySupportedAlgorithmsService = (): SupportedAlgorithmsService => {
    const getProjectSupportedAlgorithms = (): Promise<LegacySupportedAlgorithm[]> =>
        Promise.resolve(mockedSupportedAlgorithms);

    return { getLegacyProjectSupportedAlgorithms: getProjectSupportedAlgorithms };
};
