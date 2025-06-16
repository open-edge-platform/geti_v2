// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Flex, Switch } from '@geti/ui';
import { noop } from 'lodash-es';

import {
    BoolParameter,
    ConfigurationParameter,
    TrainingConfiguration,
} from '../../../../../../../core/configurable-parameters/services/configuration.interface';
import { isBoolParameter, isConfigurationParameter } from '../../../../../../../core/configurable-parameters/utils';
import { Accordion } from '../ui/accordion/accordion.component';
import { Parameter, Parameters } from '../ui/parameters.component';

type LearningParametersType = TrainingConfiguration['training'];

interface LearningParametersListProps {
    parameters: LearningParametersType;
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
}

const LearningParametersList = ({ parameters, onUpdateTrainingConfiguration }: LearningParametersListProps) => {
    return parameters.map((parameter) => {
        if (isConfigurationParameter(parameter)) {
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
        }

        const objectParameters: [string, ConfigurationParameter[]][] = Object.entries(parameter);

        return objectParameters.map(([key, parametersLocal]) => {
            if (
                parametersLocal.length === 2 &&
                parametersLocal[0].key === 'enable' &&
                isBoolParameter(parametersLocal[0])
            ) {
                const enableParameter = parametersLocal[0] as BoolParameter;
                const configParameter = parametersLocal[1];

                const handleChange = (inputParameter: ConfigurationParameter) => {
                    onUpdateTrainingConfiguration((config) => {
                        if (!config) return undefined;

                        const newConfig = structuredClone(config);

                        newConfig.training = config.training.map((trainingParameter) => {
                            if (isConfigurationParameter(trainingParameter)) {
                                return trainingParameter;
                            }

                            if (trainingParameter[key] === undefined) {
                                return trainingParameter;
                            }

                            return {
                                ...trainingParameter,
                                [key]: trainingParameter[key].map((trainingParam) =>
                                    trainingParam.key === inputParameter.key ? inputParameter : trainingParam
                                ),
                            };
                        });

                        return newConfig;
                    });
                };

                return (
                    <Parameters.Container key={key}>
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
            }
        });
    });
};

interface LearningParametersProps {
    parameters: LearningParametersType;
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
}

export const LearningParameters = ({ parameters, onUpdateTrainingConfiguration }: LearningParametersProps) => {
    console.log({ parameters });

    return (
        <Accordion>
            <Accordion.Title>
                Learning parameters
                <Accordion.Tag>Default</Accordion.Tag>
            </Accordion.Title>
            <Accordion.Content>
                <Accordion.Description>Specify the details of the learning process</Accordion.Description>
                <Accordion.Divider marginY={'size-250'} />
                <Flex direction={'column'} width={'100%'} gap={'size-300'}>
                    <LearningParametersList
                        parameters={parameters}
                        onUpdateTrainingConfiguration={onUpdateTrainingConfiguration}
                    />
                </Flex>
            </Accordion.Content>
        </Accordion>
    );
};
