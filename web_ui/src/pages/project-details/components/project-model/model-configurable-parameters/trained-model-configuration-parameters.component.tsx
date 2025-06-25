// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Loading } from '@geti/ui';

import { useTrainedModelConfigurationQuery } from '../../../../../core/configurable-parameters/hooks/use-trained-model-configuration.hook';
import { useModelIdentifier } from '../../../../../hooks/use-model-identifier/use-model-identifier.hook';

export const TrainedModelConfigurationParameters = () => {
    const { modelId, ...projectIdentifier } = useModelIdentifier();
    const { data, isPending } = useTrainedModelConfigurationQuery(projectIdentifier, { modelId });

    if (isPending) {
        return <Loading />;
    }
};
