// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC } from 'react';

import { Flex } from '@geti/ui';

import {
    ConfigurationParameter,
    TrainingConfiguration,
} from '../../../../../../../../core/configurable-parameters/services/configuration.interface';
import { Parameters } from '../../ui/parameters.component';

export type DataAugmentationParameters = TrainingConfiguration['datasetPreparation']['augmentation'];

interface DataAugmentationParametersListProps {
    parameters: DataAugmentationParameters;
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
}

export const DataAugmentationParametersList: FC<DataAugmentationParametersListProps> = ({
    parameters,
    onUpdateTrainingConfiguration,
}) => {
    const handleChange = (key: string) => (inputParameter: ConfigurationParameter) => {
        onUpdateTrainingConfiguration((config) => {
            if (!config) return undefined;

            const newConfig = structuredClone(config);
            newConfig.datasetPreparation.augmentation[key] = config.datasetPreparation.augmentation[key].map(
                (parameter) => (parameter.key === inputParameter.key ? inputParameter : parameter)
            );

            return newConfig;
        });
    };

    return (
        <Flex direction={'column'} height={'size-100%'} gap={'size-300'}>
            {Object.entries(parameters).map(([key, parametersLocal]) => {
                return <Parameters key={key} parameters={parametersLocal} onChange={handleChange(key)} />;
            })}
        </Flex>
    );
};
