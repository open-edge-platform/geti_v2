// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useState } from 'react';

import { fireEvent, screen } from '@testing-library/react';

import {
    ConfigurationParameter,
    NumberParameter,
    TrainingConfiguration,
} from '../../../../../../../../core/configurable-parameters/services/configuration.interface';
import { isBoolParameter, isConfigurationParameter } from '../../../../../../../../core/configurable-parameters/utils';
import {
    getMockedConfigurationParameter,
    getMockedTrainingConfiguration,
} from '../../../../../../../../test-utils/mocked-items-factory/mocked-configuration-parameters';
import { providersRender as render } from '../../../../../../../../test-utils/required-providers-render';
import { LearningParameters } from './learning-parameters.component';

type LearningParametersType = TrainingConfiguration['training'];

const getParameter = (name: string) => {
    return screen.getByRole('textbox', { name: `Change ${name}` });
};

const getToggleEnableParameter = (name: string) => {
    return screen.getByRole('switch', { name: `Toggle ${name}` });
};

const toggleParameter = (name: string) => {
    fireEvent.click(getToggleEnableParameter(name));
};

const resetParameter = (name: string) => {
    fireEvent.click(screen.getByRole('button', { name: `Reset ${name}` }));
};

const expectParameterToUpdateProperly = (parameter: ConfigurationParameter) => {
    if (isBoolParameter(parameter)) {
        expect(getToggleEnableParameter(parameter.name)).toBeChecked();

        toggleParameter(parameter.name);

        expect(getToggleEnableParameter(parameter.name)).not.toBeChecked();

        resetParameter(parameter.name);
        expect(getToggleEnableParameter(parameter.name)).toBeChecked();
    } else {
        const step = parameter.type === 'float' ? 0.001 : 1;

        expect(getParameter(parameter.name)).toHaveValue(parameter.value.toString());

        fireEvent.click(screen.getByRole('button', { name: `Increase Change ${parameter.name}` }));

        expect(getParameter(parameter.name)).toHaveValue((Number(parameter.value) + step).toString());

        resetParameter(parameter.name);
        expect(getParameter(parameter.name)).toHaveValue(parameter.defaultValue.toString());
    }
};

describe('LearningParameters', () => {
    const learningParameters: LearningParametersType = [
        getMockedConfigurationParameter({
            key: 'max_epochs',
            type: 'int',
            name: 'Maximum epochs',
            value: 200,
            description: 'Maximum number of training epochs to run',
            defaultValue: 500,
            maxValue: null,
            minValue: 0,
        }),
        getMockedConfigurationParameter({
            key: 'learning_rate',
            type: 'float',
            name: 'Learning rate',
            value: 0.004,
            description: 'Base learning rate for the optimizer',
            defaultValue: 0.001,
            maxValue: 1,
            minValue: 0,
        }),
        {
            early_stopping: [
                getMockedConfigurationParameter({
                    key: 'enable',
                    type: 'bool',
                    name: 'Enable early stopping',
                    value: true,
                    description: 'Whether to stop training early when performance stops improving',
                    defaultValue: true,
                }),
                getMockedConfigurationParameter({
                    key: 'patience',
                    type: 'int',
                    name: 'Patience',
                    value: 10,
                    description: 'Number of epochs with no improvement after which training will be stopped',
                    defaultValue: 1,
                    maxValue: null,
                    minValue: 0,
                }),
            ],
        },
    ];

    const App = (props: { learningParameters: LearningParametersType }) => {
        const [trainingConfiguration, setTrainingConfiguration] = useState<TrainingConfiguration | undefined>(() =>
            getMockedTrainingConfiguration({
                training: props.learningParameters,
            })
        );

        const handleUpdateTrainingConfiguration = (
            updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
        ) => {
            setTrainingConfiguration(updateFunction);
        };

        return (
            <LearningParameters
                parameters={trainingConfiguration?.training ?? props.learningParameters}
                onUpdateTrainingConfiguration={handleUpdateTrainingConfiguration}
            />
        );
    };

    it('updates tag to "Modified" when at least one parameter is changed, otherwise is "Default"', () => {
        render(<App learningParameters={learningParameters} />);

        const parameter = learningParameters[0] as NumberParameter;

        expect(screen.getByLabelText('Learning parameters tag')).toHaveTextContent('Default');

        expect(getParameter(parameter.name)).toHaveValue(parameter.value.toString());
        fireEvent.click(screen.getByRole('button', { name: `Increase Change ${parameter.name}` }));

        expect(getParameter(parameter.name)).toHaveValue((parameter.value + 1).toString());
        expect(screen.getByLabelText('Learning parameters tag')).toHaveTextContent('Modified');
    });

    it('updates parameters and resets them to default properly', () => {
        render(<App learningParameters={learningParameters} />);

        Object.values(learningParameters).forEach((parameter) => {
            if (isConfigurationParameter(parameter)) {
                expectParameterToUpdateProperly(parameter);
            } else {
                Object.values(parameter).forEach((groupParameter) => {
                    groupParameter.forEach((param) => {
                        expectParameterToUpdateProperly(param);
                    });
                });
            }
        });
    });
});
