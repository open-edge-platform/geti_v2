// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { TrainingConfiguration } from '../../../../../../../../core/configurable-parameters/services/configuration.interface';
import { isNumberParameter } from '../../../../../../../../core/configurable-parameters/utils';

type SubsetSplitParameters = TrainingConfiguration['datasetPreparation']['subsetSplit'];

const getDatasetSize = (subsetSplitParameters: SubsetSplitParameters): number => {
    const datasetSize = subsetSplitParameters.find((parameter) => parameter.key === 'dataset_size');

    if (isNumberParameter(datasetSize)) {
        return datasetSize.value;
    }

    return 0;
};

export const getSubsetsSizes = (
    subsetSplitParameters: SubsetSplitParameters,
    validationSubsetRatio: number,
    testSubsetRatio: number
) => {
    const datasetSize = getDatasetSize(subsetSplitParameters);

    const validationSubsetSize = Math.floor(datasetSize * (validationSubsetRatio / 100));
    const testSubsetSize = Math.floor(datasetSize * (testSubsetRatio / 100));
    const trainingSubsetSize = datasetSize - validationSubsetSize - testSubsetSize;

    return {
        trainingSubsetSize,
        validationSubsetSize,
        testSubsetSize,
    };
};
