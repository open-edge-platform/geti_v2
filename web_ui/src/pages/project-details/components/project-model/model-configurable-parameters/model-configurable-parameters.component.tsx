// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useFeatureFlags } from '@geti/core/src/feature-flags/hooks/use-feature-flags.hook';
import { Loading, View } from '@geti/ui';

import { useConfigParameters } from '../../../../../core/configurable-parameters/hooks/use-config-parameters.hook';
import { ConfigurableParametersType } from '../../../../../core/configurable-parameters/services/configurable-parameters.interface';
import { useModelIdentifier } from '../../../../../hooks/use-model-identifier/use-model-identifier.hook';
import { ConfigurableParameters } from '../../../../../shared/components/configurable-parameters/configurable-parameters.component';
import { TrainedModelConfigurationParameters } from './trained-model-configuration-parameters/trained-model-configuration-parameters.component';

interface ModelConfigurableParametersProps {
    taskId: string;
}

const LegacyModelConfigurableParameters = ({ taskId }: { taskId: string }) => {
    const { modelId, ...projectIdentifier } = useModelIdentifier();
    const { useGetModelConfigParameters } = useConfigParameters(projectIdentifier);
    const { isPending, data } = useGetModelConfigParameters({ taskId, modelId });

    return isPending ? (
        <Loading />
    ) : data ? (
        <View marginTop={'size-250'} height={'100%'}>
            <ConfigurableParameters
                type={ConfigurableParametersType.READ_ONLY_SINGLE_PARAMETERS}
                configParametersData={data}
            />
        </View>
    ) : (
        <></>
    );
};

export const ModelConfigurableParameters = ({ taskId }: ModelConfigurableParametersProps) => {
    const { FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS } = useFeatureFlags();

    if (FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS) {
        return <TrainedModelConfigurationParameters taskId={taskId} />;
    }

    return <LegacyModelConfigurableParameters taskId={taskId} />;
};
