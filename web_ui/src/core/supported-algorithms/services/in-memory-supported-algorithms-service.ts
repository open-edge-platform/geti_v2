// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { getMockedSupportedAlgorithm } from '../../../test-utils/mocked-items-factory/mocked-supported-algorithms';
import { LegacySupportedAlgorithm } from '../supported-algorithms.interface';
import { SupportedAlgorithmsService } from './supported-algorithms.interface';
import { mockedSupportedAlgorithms } from './test-utils';

export const createInMemorySupportedAlgorithmsService = (): SupportedAlgorithmsService => {
    const getLegacyProjectSupportedAlgorithms: SupportedAlgorithmsService['getLegacyProjectSupportedAlgorithms'] =
        (): Promise<LegacySupportedAlgorithm[]> => Promise.resolve(mockedSupportedAlgorithms);

    const getProjectSupportedAlgorithms: SupportedAlgorithmsService['getProjectSupportedAlgorithms'] = () => {
        return Promise.resolve([getMockedSupportedAlgorithm()]);
    };

    return { getLegacyProjectSupportedAlgorithms, getProjectSupportedAlgorithms };
};
