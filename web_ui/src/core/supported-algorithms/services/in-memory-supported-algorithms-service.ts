// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { getMockedSupportedAlgorithm } from '../../../test-utils/mocked-items-factory/mocked-supported-algorithms';
import { SupportedAlgorithmsService } from './supported-algorithms.interface';

export const createInMemorySupportedAlgorithmsService = (): SupportedAlgorithmsService => {
    const getProjectSupportedAlgorithms: SupportedAlgorithmsService['getProjectSupportedAlgorithms'] = () => {
        return Promise.resolve([getMockedSupportedAlgorithm()]);
    };

    return { getProjectSupportedAlgorithms };
};
