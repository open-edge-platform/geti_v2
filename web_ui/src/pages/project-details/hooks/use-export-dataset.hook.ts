// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useRef } from 'react';

import QUERY_KEYS from '@geti/core/src/requests/query-keys';
import { useApplicationServices } from '@geti/core/src/services/application-services-provider.component';
import { removeToasts, toast } from '@geti/ui';
import { useMutation, UseMutationResult, useQuery, UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { ExportDatasetStatusDTO } from '../../../core/configurable-parameters/dtos/configurable-parameters.interface';
import { IntervalJobHandlers } from '../../../core/datasets/hooks/dataset-import.interface';
import { getIntervalJobHandlers } from '../../../core/datasets/hooks/utils';
import { JobExportStatus, JobStatusIdentifier } from '../../../core/jobs/jobs.interface';
import { ExportDatasetIdentifier, ExportDatasetStatusIdentifier } from '../../../core/projects/dataset.interface';
import { isStateDone, isStateError } from '../../../core/projects/hooks/utils';
import { useLocalStorageExportDataset } from './use-local-storage-export-dataset.hook';

export interface UseExportDataset {
    exportDatasetStatus: UseMutationResult<ExportDatasetStatusDTO, AxiosError, ExportDatasetStatusIdentifier>;
    prepareExportDatasetJob: UseMutationResult<{ jobId: string }, AxiosError, ExportDatasetIdentifier>;
    useExportDatasetStatusJob: (params: StatusJobProps<JobExportStatus>) => UseQueryResult<JobExportStatus>;
}

export interface StatusJobProps<T> extends Omit<IntervalJobHandlers<T>, 'onError'> {
    data: JobStatusIdentifier;
    enabled: boolean;
}

export const useExportDataset = (datasetName: string): UseExportDataset => {
    const { projectService } = useApplicationServices();
    const { addLsExportDataset } = useLocalStorageExportDataset();

    const onError = (error: AxiosError) => {
        toast({ message: error.message, type: 'error' });
    };

    const prepareExportDatasetJob = useMutation({
        mutationFn: projectService.prepareExportDatasetJob,
        onSuccess: ({ jobId }, { datasetId, exportFormat }) => {
            removeToasts();

            return addLsExportDataset({
                datasetId,
                exportFormat,
                exportDatasetId: jobId,
                isPrepareDone: false,
                datasetName,
            });
        },
        onError,
    });

    const exportDatasetStatus = useMutation({
        mutationFn: projectService.exportDatasetStatus,
        onSuccess: (response, { datasetId }) => {
            if (isStateDone(response.state)) {
                toast({
                    message: `Dataset ${datasetId} is ready to download`,
                    type: 'info',
                });
            }
            if (isStateError(response.state)) {
                toast({ message: response.message, type: 'error' });
            }
        },
        onError,
    });

    const useExportDatasetStatusJob = ({
        data,
        enabled = true,
        ...intervalHandlers
    }: StatusJobProps<JobExportStatus>) => {
        const handleSuccessRef = useRef(intervalHandlers);

        const query = useQuery({
            queryKey: QUERY_KEYS.EXPORT_DATASET_STATUS_JOB_KEY(data),
            queryFn: () => projectService.exportDatasetStatusJob(data),
            enabled,
            meta: { notifyOnError: true },
            refetchInterval: 1000,
        });

        useEffect(() => {
            handleSuccessRef.current = intervalHandlers;
        }, [intervalHandlers]);

        useEffect(() => {
            if (!enabled || !query.isSuccess) {
                return;
            }

            getIntervalJobHandlers({ onError, ...handleSuccessRef.current })(query.data);
        }, [enabled, query.isSuccess, query.data]);

        return query;
    };

    return {
        exportDatasetStatus,
        prepareExportDatasetJob,
        useExportDatasetStatusJob,
    };
};
