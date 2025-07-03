// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { TrainedModelConfiguration } from '../../../../../../core/configurable-parameters/services/configuration.interface';
import { isConfigurationParameter } from '../../../../../../core/configurable-parameters/utils';

export const isLearningParameterModified = (parameters: TrainedModelConfiguration['training']): boolean => {
    return parameters.some((parameter) => {
        if (isConfigurationParameter(parameter)) {
            return parameter.defaultValue !== parameter.value;
        }

        return Object.values(parameter).some((subParameter) => {
            return subParameter.some((subSubParameter) => {
                return subSubParameter.defaultValue !== subSubParameter.value;
            });
        });
    });
};
