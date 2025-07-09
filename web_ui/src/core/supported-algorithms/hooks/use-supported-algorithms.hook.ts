// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useFeatureFlags } from '@geti/core/src/feature-flags/hooks/use-feature-flags.hook';
import { useApplicationServices } from '@geti/core/src/services/application-services-provider.component';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import QUERY_KEYS from '../../../../packages/core/src/requests/query-keys';
import { ProjectIdentifier } from '../../projects/core.interface';
import { LegacySupportedAlgorithm, SupportedAlgorithm } from '../supported-algorithms.interface';

export const useSupportedAlgorithms = (
    projectIdentifier: ProjectIdentifier
): UseQueryResult<SupportedAlgorithm[] | LegacySupportedAlgorithm[], AxiosError> => {
    const { supportedAlgorithmsService } = useApplicationServices();
    const { FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS } = useFeatureFlags();

    return useQuery<SupportedAlgorithm[] | LegacySupportedAlgorithm[], AxiosError>({
        queryKey: QUERY_KEYS.SUPPORTED_ALGORITHMS(projectIdentifier),
        queryFn: () => {
            if (FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS) {
                return supportedAlgorithmsService.getProjectSupportedAlgorithms(projectIdentifier);
            }
            return supportedAlgorithmsService.getLegacyProjectSupportedAlgorithms(projectIdentifier);
        },
        // This query is used to fetch supported algorithms for a project, they never change.
        staleTime: Infinity,
    });
};
