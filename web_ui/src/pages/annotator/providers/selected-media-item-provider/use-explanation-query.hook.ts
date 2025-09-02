// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import QUERY_KEYS from '@geti/core/src/requests/query-keys';
import { useApplicationServices } from '@geti/core/src/services/application-services-provider.component';
import { QueryKey, useQuery, UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { ExplanationResult } from '../../../../core/annotations/services/inference-service.interface';
import { MediaItem } from '../../../../core/media/media.interface';
import { DatasetIdentifier } from '../../../../core/projects/dataset.interface';

interface UseGetExplanations {
    datasetIdentifier: DatasetIdentifier;
    mediaItem: MediaItem | undefined;
    enabled?: boolean;
    taskId?: string;
}

export const useExplanationsQuery = ({
    datasetIdentifier,
    mediaItem,
    enabled = true,
    taskId,
}: UseGetExplanations): UseQueryResult<ExplanationResult, AxiosError> => {
    const { inferenceService } = useApplicationServices();

    const queryKey: QueryKey = QUERY_KEYS.SELECTED_MEDIA_ITEM.EXPLANATIONS(
        datasetIdentifier,
        mediaItem?.identifier,
        taskId
    );

    return useQuery({
        queryKey,
        queryFn: async ({ signal }) => {
            if (!mediaItem) throw new Error("Can't fetch undefined media item");

            try {
                const explanations = await inferenceService.getExplanations(
                    datasetIdentifier,
                    mediaItem,
                    taskId,
                    undefined,
                    signal
                );

                return explanations ?? [];
            } catch (_error) {
                return [];
            }
        },
        enabled: enabled && !!mediaItem,
        staleTime: 5 * 60_000,
        gcTime: 0,
    });
};
