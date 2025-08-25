// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect } from 'react';

import { useApplicationServices } from '@geti/core/src/services/application-services-provider.component';
import { toast } from '@geti/ui';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { AxiosError, HttpStatusCode } from 'axios';

import QUERY_KEYS from '../../../../packages/core/src/requests/query-keys';
import { getErrorMessage } from '../../../../packages/core/src/services/utils';
import { ModelIdentifier } from '../../models/models.interface';
import { ModelMetrics } from '../model-statistics.interface';

export const useModelStatistics = (modelIdentifier: ModelIdentifier): UseQueryResult<ModelMetrics, AxiosError> => {
    const service = useApplicationServices().modelStatisticsService;

    const modelStatisticsQuery = useQuery<ModelMetrics, AxiosError>({
        queryKey: QUERY_KEYS.MODEL_STATISTICS_KEY(modelIdentifier),
        queryFn: () => {
            return service.getModelStatistics(modelIdentifier);
        },
        retry: 1,
    });

    useEffect(() => {
        if (!modelStatisticsQuery.isError || modelStatisticsQuery.error === undefined) {
            return;
        }

        if (modelStatisticsQuery.error.response?.status === HttpStatusCode.NotFound) {
            toast({ message: getErrorMessage(modelStatisticsQuery.error), type: 'error' });
        }
    }, [modelStatisticsQuery.isError, modelStatisticsQuery.error]);

    return modelStatisticsQuery;
};
