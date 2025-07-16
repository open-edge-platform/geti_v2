// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Flex } from '@geti/ui';
import { noop, partition } from 'lodash-es';

import {
    ConfigurationParameter,
    TrainingConfiguration,
} from '../../../../../../../../core/configurable-parameters/services/configuration.interface';
import { isConfigurationParameter, isEnumParameter } from '../../../../../../../../core/configurable-parameters/utils';
import { Parameters } from '../../ui/parameters.component';
import {
    INPUT_SIZE_HEIGHT_KEY,
    INPUT_SIZE_WIDTH_KEY,
    InputSizeParameters,
    NUMBER_OF_INPUT_SIZE_PARAMETERS,
} from './input-size-parameters.component';

export type LearningParametersType = TrainingConfiguration['training'];

interface LearningParametersListProps {
    parameters: LearningParametersType;
    onUpdateTrainingConfiguration?: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
    isReadOnly?: boolean;
}

interface SingleLearningParameterProps {
    parameter: ConfigurationParameter;
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
    isReadOnly: boolean;
}

const SingleLearningParameter = ({
    parameter,
    onUpdateTrainingConfiguration,
    isReadOnly,
}: SingleLearningParameterProps) => {
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

    return <Parameters key={parameter.key} parameters={[parameter]} onChange={handleChange} isReadOnly={isReadOnly} />;
};

interface LearningParametersGroupProps {
    groupKey: string;
    parameters: ConfigurationParameter[];
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
    isReadOnly: boolean;
}

const LearningParametersGroup = ({
    groupKey,
    parameters,
    isReadOnly,
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

    return <Parameters parameters={parameters} onChange={handleChange} isReadOnly={isReadOnly} />;
};

export const LearningParametersList = ({
    parameters,
    onUpdateTrainingConfiguration = noop,
    isReadOnly = false,
}: LearningParametersListProps) => {
    const [inputSizeParameters, restParameters] = partition(
        parameters,
        (parameter) => parameter.key === INPUT_SIZE_WIDTH_KEY || parameter.key === INPUT_SIZE_HEIGHT_KEY
    );

    return (
        <Flex direction={'column'} width={'100%'} gap={'size-300'}>
            {inputSizeParameters.length === NUMBER_OF_INPUT_SIZE_PARAMETERS &&
                inputSizeParameters.every(isEnumParameter) && (
                    <InputSizeParameters
                        isReadOnly={isReadOnly}
                        inputSizeParameters={inputSizeParameters}
                        onUpdateTrainingConfiguration={onUpdateTrainingConfiguration}
                    />
                )}
            {restParameters.map((parameter) => {
                if (isConfigurationParameter(parameter)) {
                    return (
                        <SingleLearningParameter
                            key={parameter.key}
                            parameter={parameter}
                            onUpdateTrainingConfiguration={onUpdateTrainingConfiguration}
                            isReadOnly={isReadOnly}
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
                            isReadOnly={isReadOnly}
                        />
                    );
                });
            })}
        </Flex>
    );
};
