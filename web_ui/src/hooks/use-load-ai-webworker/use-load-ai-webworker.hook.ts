// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useQuery } from '@tanstack/react-query';
import { Remote, wrap } from 'comlink';

import { AlgorithmType } from './algorithm.interface';
import { MapAlgorithmToInstance, WorkerFactory } from './load-webworker.interface';
import { getWorker } from './utils';

export const useLoadAIWebworker = <T extends AlgorithmType>(algorithmType: T) => {
    const { data, isLoading, isSuccess, isError } = useQuery<Remote<MapAlgorithmToInstance[T]>>({
        queryKey: ['workers', algorithmType],
        queryFn: async () => {
            const baseWorker = getWorker(algorithmType);
            const worker = wrap<WorkerFactory<T>>(baseWorker);

            return worker.build();
        },
        staleTime: Infinity,
    });

    return { worker: data, isLoading, isSuccess, isError };
};
