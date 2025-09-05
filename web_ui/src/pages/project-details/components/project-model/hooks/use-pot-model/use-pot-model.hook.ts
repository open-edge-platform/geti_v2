// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import QUERY_KEYS from '@geti/core/src/requests/query-keys';
import { toast } from '@geti/ui';
import { useQueryClient } from '@tanstack/react-query';

import { useModels } from '../../../../../../core/models/hooks/use-models.hook';
import { useModelIdentifier } from '../../../../../../hooks/use-model-identifier/use-model-identifier.hook';
import { STARTED_OPTIMIZATION } from '../../model-variants/utils';

interface UsePOTModel {
    optimizePOTModel: () => void;
    isLoading: boolean;
}

export const usePOTModel = (): UsePOTModel => {
    const modelIdentifier = useModelIdentifier();
    const { useOptimizeModelMutation } = useModels();
    const optimizeModel = useOptimizeModelMutation();
    const queryClient = useQueryClient();

    const optimizePOTModel = (): void => {
        optimizeModel.mutate(
            { modelIdentifier },
            {
                onSuccess: async () => {
                    toast({ message: STARTED_OPTIMIZATION, type: 'info' });

                    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MODEL_KEY(modelIdentifier) });
                },
            }
        );
    };

    return {
        optimizePOTModel,
        isLoading: optimizeModel.isPending,
    };
};
