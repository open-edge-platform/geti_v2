// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import {
    ConfigurationParameter,
    TrainingConfiguration,
} from '../../../../../../../../core/configurable-parameters/services/configuration.interface';
import { isConfigurationParameter } from '../../../../../../../../core/configurable-parameters/utils';
import { Parameters } from '../../ui/parameters.component';

export type LearningParametersType = TrainingConfiguration['training'];

interface LearningParametersListProps {
    parameters: LearningParametersType;
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
}

interface SingleLearningParameterProps {
    parameter: ConfigurationParameter;
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
}

const SingleLearningParameter = ({ parameter, onUpdateTrainingConfiguration }: SingleLearningParameterProps) => {
    const handleChange = (inputParameter: ConfigurationParameter) => {
        onUpdateTrainingConfiguration((config) => {
            if (!config) return undefined;

            const newConfig = structuredClone(config);

            newConfig.training = config.training.map((trainingParameter) => {
                if (trainingParameter.key === inputParameter.key) {
                    return inputParameter;
                }

                return trainingParameter;
            });

            return newConfig;
        });
    };

    return <Parameters key={parameter.key} parameters={[parameter]} onChange={handleChange} />;
};

interface LearningParametersGroupProps {
    groupKey: string;
    parameters: ConfigurationParameter[];
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
}

const LearningParametersGroup = ({
    groupKey,
    parameters,
    onUpdateTrainingConfiguration,
}: LearningParametersGroupProps) => {
    const handleChange = (inputParameter: ConfigurationParameter) => {
        onUpdateTrainingConfiguration((config) => {
            if (!config) return undefined;

            const newConfig = structuredClone(config);

            newConfig.training = config.training.map((trainingParameter) => {
                if (isConfigurationParameter(trainingParameter)) {
                    return trainingParameter;
                }

                if (trainingParameter[groupKey] === undefined) {
                    return trainingParameter;
                }

                return {
                    ...trainingParameter,
                    [groupKey]: trainingParameter[groupKey].map((trainingParam) =>
                        trainingParam.key === inputParameter.key ? inputParameter : trainingParam
                    ),
                };
            });

            return newConfig;
        });
    };

    return <Parameters parameters={parameters} onChange={handleChange} />;
};

export const LearningParametersList = ({ parameters, onUpdateTrainingConfiguration }: LearningParametersListProps) => {
    return parameters.map((parameter) => {
        if (isConfigurationParameter(parameter)) {
            return (
                <SingleLearningParameter
                    key={parameter.key}
                    parameter={parameter}
                    onUpdateTrainingConfiguration={onUpdateTrainingConfiguration}
                />
            );
        }

        const objectParameters: [string, ConfigurationParameter[]][] = Object.entries(parameter);

        return objectParameters.map(([key, parametersLocal]) => {
            return (
                <LearningParametersGroup
                    key={key}
                    groupKey={key}
                    parameters={parametersLocal}
                    onUpdateTrainingConfiguration={onUpdateTrainingConfiguration}
                />
            );
        });
    });
};
