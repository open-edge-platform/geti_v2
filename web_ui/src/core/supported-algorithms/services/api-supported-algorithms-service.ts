// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { apiClient } from '@geti/core';

import { CreateApiService } from '../../../../packages/core/src/services/create-api-service.interface';
import { API_URLS } from '../../../../packages/core/src/services/urls';
import { ProjectIdentifier } from '../../projects/core.interface';
import { SupportedAlgorithmDTO, SupportedAlgorithmsResponseDTO } from '../dtos/supported-algorithms.interface';
import { LegacySupportedAlgorithm } from '../supported-algorithms.interface';
import { SupportedAlgorithmsService } from './supported-algorithms.interface';
import { getLegacySupportedAlgorithmsEntities, getSupportedAlgorithmsEntities } from './utils';

export const createApiSupportedAlgorithmsService: CreateApiService<SupportedAlgorithmsService> = (
    { instance, router } = { instance: apiClient, router: API_URLS }
) => {
    const getLegacyProjectSupportedAlgorithms = async (
        projectIdentifier: ProjectIdentifier
    ): Promise<LegacySupportedAlgorithm[]> => {
        const { data } = await instance.get<SupportedAlgorithmsResponseDTO>(
            router.PROJECT_SUPPORTED_ALGORITHMS(projectIdentifier)
        );

        return getLegacySupportedAlgorithmsEntities(data);
    };

    const getProjectSupportedAlgorithms: SupportedAlgorithmsService['getProjectSupportedAlgorithms'] = async (
        projectIdentifier
    ) => {
        const { data } = await instance.get<{ supported_algorithms: SupportedAlgorithmDTO[] }>(
            router.PROJECT_SUPPORTED_ALGORITHMS(projectIdentifier)
        );

        return getSupportedAlgorithmsEntities(data.supported_algorithms);
    };

    return { getLegacyProjectSupportedAlgorithms, getProjectSupportedAlgorithms };
};
