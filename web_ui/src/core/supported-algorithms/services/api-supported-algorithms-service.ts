// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { apiClient } from '@geti/core';

import { CreateApiService } from '../../../../packages/core/src/services/create-api-service.interface';
import { API_URLS } from '../../../../packages/core/src/services/urls';
import { SupportedAlgorithmDTO } from '../dtos/supported-algorithms.interface';
import { SupportedAlgorithmsService } from './supported-algorithms.interface';
import { getSupportedAlgorithmsEntities } from './utils';

export const createApiSupportedAlgorithmsService: CreateApiService<SupportedAlgorithmsService> = (
    { instance, router } = { instance: apiClient, router: API_URLS }
) => {
    const getProjectSupportedAlgorithms: SupportedAlgorithmsService['getProjectSupportedAlgorithms'] = async (
        projectIdentifier
    ) => {
        const { data } = await instance.get<{ supported_algorithms: SupportedAlgorithmDTO[] }>(
            router.PROJECT_SUPPORTED_ALGORITHMS(projectIdentifier)
        );

        return getSupportedAlgorithmsEntities(data.supported_algorithms);
    };

    return { getProjectSupportedAlgorithms };
};
