// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useQuery } from '@tanstack/react-query';
import { wrap } from 'comlink';

import { AlgorithmType } from './algorithm.interface';
import { MapAlgorithmToWorker } from './load-webworker.interface';
import { getWorker } from './utils';

const WORKERS_WITH_BUILD_METHOD = [
    AlgorithmType.WATERSHED,
    AlgorithmType.INFERENCE_IMAGE,
    // TODO: Add the rest of the tools here, one at a time
];

export const useLoadAIWebworker = <T extends AlgorithmType>(algorithmType: T) => {
    const { data, isLoading, isSuccess, isError } = useQuery({
        queryKey: ['workers', algorithmType],
        queryFn: async () => {
            const baseWorker = getWorker(algorithmType);
            const worker = wrap<MapAlgorithmToWorker[T]>(baseWorker);

            if (WORKERS_WITH_BUILD_METHOD.includes(algorithmType)) {
                // @ts-expect-error for now only some workers have the build method
                // (the ones in the smart-tools package)
                return await worker.build();
            }

            await worker.loadOpenCV();

            return worker;
        },
        staleTime: Infinity,
    });

    return { worker: data, isLoading, isSuccess, isError };
};
