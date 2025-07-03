// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import QUERY_KEYS from '@geti/core/src/requests/query-keys';
import { useApplicationServices } from '@geti/core/src/services/application-services-provider.component';
import { queryOptions, useQuery } from '@tanstack/react-query';

import { ProjectIdentifier } from '../../projects/core.interface';
import {
    CreateApiModelConfigParametersService,
    TrainedModelConfigurationQueryParameters,
} from '../services/api-model-config-parameters-service';

const trainedModelConfigurationQueryOptions = (
    service: CreateApiModelConfigParametersService,
    projectIdentifier: ProjectIdentifier,
    queryParameters: TrainedModelConfigurationQueryParameters
) =>
    queryOptions({
        queryKey: QUERY_KEYS.CONFIGURATION_PARAMETERS.TRAINED_MODEL(projectIdentifier, queryParameters),
        queryFn: () => {
            return service.getTrainedModelConfiguration(projectIdentifier, queryParameters);
        },
    });

export const useTrainedModelConfigurationQuery = (
    projectIdentifier: ProjectIdentifier,
    queryParameters: TrainedModelConfigurationQueryParameters
) => {
    const { configParametersService } = useApplicationServices();

    return useQuery(trainedModelConfigurationQueryOptions(configParametersService, projectIdentifier, queryParameters));
};
