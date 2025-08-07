// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC } from 'react';

import { View } from '@geti/ui';
import { isEmpty } from 'lodash-es';

import { TrainingConfiguration } from '../../../../../../../core/configurable-parameters/services/configuration.interface';
import { DataAugmentation } from './data-augmentation/data-augmentation.component';
import { Filters } from './filters/filters.component';
import { Tiling } from './tiling/tiling.component';
import { TrainingSubsets } from './training-subsets/training-subsets.component';

interface DataManagementProps {
    trainingConfiguration: TrainingConfiguration;
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
}

const getAugmentationParameters = (configuration: TrainingConfiguration) => {
    const augmentation = structuredClone(configuration.datasetPreparation.augmentation);

    delete augmentation['tiling'];

    return augmentation;
};

export const DataManagement: FC<DataManagementProps> = ({ trainingConfiguration, onUpdateTrainingConfiguration }) => {
    const augmentationParameters = getAugmentationParameters(trainingConfiguration);
    const subsetSplitParameters = trainingConfiguration.datasetPreparation.subsetSplit;
    const filteringParameters = trainingConfiguration.datasetPreparation.filtering;
    const tilingParameters = trainingConfiguration.datasetPreparation.augmentation.tiling;

    return (
        <View>
            {/* Not supported in v1 of training flow revamp <BalanceLabelsDistribution /> */}
            {!isEmpty(subsetSplitParameters) && (
                <TrainingSubsets
                    subsetsParameters={trainingConfiguration.datasetPreparation.subsetSplit}
                    onUpdateTrainingConfiguration={onUpdateTrainingConfiguration}
                />
            )}
            {!isEmpty(tilingParameters) && (
                <Tiling
                    tilingParameters={tilingParameters}
                    onUpdateTrainingConfiguration={onUpdateTrainingConfiguration}
                />
            )}
            {!isEmpty(augmentationParameters) && (
                <DataAugmentation
                    parameters={augmentationParameters}
                    onUpdateTrainingConfiguration={onUpdateTrainingConfiguration}
                />
            )}
            {!isEmpty(filteringParameters) && (
                <Filters
                    filtersConfiguration={filteringParameters}
                    onUpdateTrainingConfiguration={onUpdateTrainingConfiguration}
                />
            )}
            {/* Not supported in v1 of training flow revamp <RemovingDuplicates /> */}
        </View>
    );
};
