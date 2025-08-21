// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useApplicationServices } from '@geti/core/src/services/application-services-provider.component';
import { toast } from '@geti/ui';
import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import QUERY_KEYS from '../../../../packages/core/src/requests/query-keys';
import { clearDatasetStorage } from '../../../hooks/use-clear-indexeddb-storage/use-clear-indexeddb-storage.hook';
import {
    CreateDatasetBody,
    CreateDatasetResponse,
    Dataset,
    DatasetIdentifier,
    DeleteDatasetResponse,
} from '../dataset.interface';

interface UpdateDatasetBody {
    datasetIdentifier: DatasetIdentifier;
    updatedDataset: Dataset;
}

interface UseProjectDataset {
    createDataset: UseMutationResult<CreateDatasetResponse, AxiosError, CreateDatasetBody>;
    updateDataset: UseMutationResult<CreateDatasetResponse, AxiosError, UpdateDatasetBody>;
    deleteDataset: UseMutationResult<DeleteDatasetResponse, AxiosError, DatasetIdentifier>;
}

export const useProjectDataset = (): UseProjectDataset => {
    const service = useApplicationServices().projectService;
    const client = useQueryClient();

    const createDataset = useMutation<CreateDatasetResponse, AxiosError, CreateDatasetBody>({
        mutationFn: service.createDataset,
        onSuccess: async (_, variables) => {
            await client.invalidateQueries({ queryKey: QUERY_KEYS.PROJECT_KEY(variables.projectIdentifier) });
        },
        onError: (error: AxiosError) => {
            toast({ message: error.message, type: 'error' });
        },
    });

    const deleteDataset = useMutation<DeleteDatasetResponse, AxiosError, DatasetIdentifier>({
        mutationFn: service.deleteDataset,
        onSuccess: async (_, variables) => {
            clearDatasetStorage(variables.datasetId);

            await client.invalidateQueries({ queryKey: QUERY_KEYS.PROJECT_KEY(variables) });
        },
        onError: (error: AxiosError) => {
            toast({ message: error.message, type: 'error' });
        },
    });

    const updateDataset = useMutation({
        mutationFn: ({ datasetIdentifier, updatedDataset }: UpdateDatasetBody) => {
            return service.updateDataset(datasetIdentifier, updatedDataset);
        },

        onSuccess: async (_, variables) => {
            await client.invalidateQueries({ queryKey: QUERY_KEYS.PROJECT_KEY(variables.datasetIdentifier) });
        },

        onError: (error: AxiosError) => {
            toast({ message: error.message, type: 'error' });
        },
    });

    return { createDataset, updateDataset, deleteDataset };
};
