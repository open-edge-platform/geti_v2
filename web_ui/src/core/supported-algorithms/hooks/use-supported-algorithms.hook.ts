// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useApplicationServices } from '@geti/core/src/services/application-services-provider.component';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import QUERY_KEYS from '../../../../packages/core/src/requests/query-keys';
import { ProjectIdentifier } from '../../projects/core.interface';
import { SupportedAlgorithm } from '../supported-algorithms.interface';

export const useSupportedAlgorithms = (
    projectIdentifier: ProjectIdentifier
): UseQueryResult<SupportedAlgorithm[], AxiosError> => {
    const { supportedAlgorithmsService } = useApplicationServices();

    return useQuery<SupportedAlgorithm[], AxiosError>({
        queryKey: QUERY_KEYS.SUPPORTED_ALGORITHMS(projectIdentifier),
        queryFn: () => supportedAlgorithmsService.getProjectSupportedAlgorithms(projectIdentifier),
        // This query is used to fetch supported algorithms for a project, they never change.
        staleTime: Infinity,
    });
};
