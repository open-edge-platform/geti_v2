// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Flex, Switch } from '@geti/ui';

import {
    BoolParameter,
    ConfigurationParameter,
    TrainingConfiguration,
} from '../../../../../../../../core/configurable-parameters/services/configuration.interface';
import { isBoolParameter, isConfigurationParameter } from '../../../../../../../../core/configurable-parameters/utils';
import { Parameter, Parameters } from '../../ui/parameters.component';

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
    const handleChange = (value: number | boolean | string) => {
        onUpdateTrainingConfiguration((config) => {
            if (!config) return undefined;

            const newConfig = structuredClone(config);

            newConfig.training = config.training.map((trainingParameter) => {
                if (trainingParameter.key === parameter.key) {
                    return {
                        ...trainingParameter,
                        value,
                    } as ConfigurationParameter;
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
    const enableParameter = parameters[0] as BoolParameter;
    const configParameter = parameters[1];

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

    return (
        <Parameters.Container key={groupKey}>
            <Parameter.Layout
                header={configParameter.name}
                description={configParameter.description}
                onReset={() => {
                    handleChange({
                        ...enableParameter,
                        value: enableParameter.defaultValue,
                    });
                    handleChange({
                        ...configParameter,
                        value: configParameter.defaultValue,
                    } as ConfigurationParameter);
                }}
            >
                <Flex gap={'size-100'}>
                    <Switch
                        isEmphasized
                        isSelected={enableParameter.value}
                        onChange={(isSelected) => {
                            handleChange({ ...enableParameter, value: isSelected });
                        }}
                        aria-label={`Toggle ${configParameter.name}`}
                    />
                    <Parameter.Field
                        parameter={configParameter}
                        onChange={(value) => {
                            handleChange({ ...configParameter, value } as ConfigurationParameter);
                        }}
                        isDisabled={!enableParameter.value}
                    />
                </Flex>
            </Parameter.Layout>
        </Parameters.Container>
    );
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
            if (
                parametersLocal.length === 2 &&
                parametersLocal[0].key === 'enable' &&
                isBoolParameter(parametersLocal[0])
            ) {
                return (
                    <LearningParametersGroup
                        key={key}
                        groupKey={key}
                        parameters={parametersLocal}
                        onUpdateTrainingConfiguration={onUpdateTrainingConfiguration}
                    />
                );
            }

            return null;
        });
    });
};
