// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import {
    BoolParameter,
    ConfigurationParameter,
    EnumConfigurationParameter,
    NumberParameter,
    ProjectConfiguration,
    TrainedModelConfiguration,
    TrainingConfiguration,
} from '../../core/configurable-parameters/services/configuration.interface';

export const getMockedProjectConfiguration = (config: Partial<ProjectConfiguration> = {}): ProjectConfiguration => ({
    taskConfigs: [
        {
            taskId: '68494835ba2d28685b0d799b',
            training: {
                constraints: [
                    {
                        key: 'min_images_per_label',
                        type: 'int',
                        name: 'Minimum number of images per label',
                        value: 0,
                        description: 'Minimum number of images that must be present for each label to train',
                        defaultValue: 0,
                        maxValue: 5,
                        minValue: 0,
                    },
                ],
            },
            autoTraining: [
                {
                    key: 'enable',
                    type: 'bool',
                    name: 'Enable auto training',
                    value: true,
                    description: 'Whether automatic training is enabled for this task',
                    defaultValue: true,
                },
                {
                    key: 'enable_dynamic_required_annotations',
                    type: 'bool',
                    name: 'Enable dynamic required annotations',
                    value: false,
                    description: 'Whether to dynamically adjust the number of required annotations',
                    defaultValue: false,
                },
                {
                    key: 'required_images_auto_training',
                    type: 'int',
                    name: 'Required images for auto training',
                    value: 0,
                    description: '',
                    defaultValue: 0,
                    maxValue: 1000,
                    minValue: 0,
                },
                {
                    key: 'min_images_per_label',
                    type: 'int',
                    name: 'Minimum images per label',
                    value: 0,
                    description: 'Minimum number of images needed for each label to trigger auto-training',
                    defaultValue: 0,
                    maxValue: 3,
                    minValue: 0,
                },
            ],
        },
    ],
    ...config,
});

export const getMockedTrainingConfiguration = (config: Partial<TrainingConfiguration> = {}): TrainingConfiguration => ({
    training: [
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
    ],
    datasetPreparation: {
        subsetSplit: [
            getMockedConfigurationParameter({
                key: 'training',
                type: 'int',
                name: 'Training percentage',
                value: 70,
                description: 'Percentage of data to use for training',
                defaultValue: 70,
                maxValue: 100,
                minValue: 1,
            }),
            getMockedConfigurationParameter({
                key: 'validation',
                type: 'int',
                name: 'Validation percentage',
                value: 20,
                description: 'Percentage of data to use for validation',
                defaultValue: 20,
                maxValue: 100,
                minValue: 1,
            }),
            getMockedConfigurationParameter({
                key: 'test',
                type: 'int',
                name: 'Test percentage',
                value: 10,
                description: 'Percentage of data to use for testing',
                defaultValue: 10,
                maxValue: 100,
                minValue: 1,
            }),
            getMockedConfigurationParameter({
                key: 'dataset_size',
                type: 'int',
                name: 'Dataset size',
                value: 100,
                description: 'Dataset size',
                defaultValue: 100,
                maxValue: null,
                minValue: 1,
            }),
        ],
        augmentation: {},
        filtering: {},
    },
    taskId: '',
    evaluation: [],
    ...config,
});

export const getMockedTrainedModelConfigurationParameters = (
    config: Partial<TrainedModelConfiguration> = {}
): TrainedModelConfiguration => ({
    training: [],
    datasetPreparation: {
        augmentation: {},
    },
    evaluation: [],
    taskId: '',
    advancedConfiguration: [],
    ...config,
});

export function getMockedConfigurationParameter(
    parameter: Partial<EnumConfigurationParameter> & Required<Pick<ConfigurationParameter, 'type'>>
): EnumConfigurationParameter;
export function getMockedConfigurationParameter(
    parameter: Partial<NumberParameter> & Required<Pick<NumberParameter, 'type'>>
): NumberParameter;
export function getMockedConfigurationParameter(
    parameter: Partial<BoolParameter> & Required<Pick<BoolParameter, 'type'>>
): BoolParameter;
export function getMockedConfigurationParameter(
    parameter: Partial<ConfigurationParameter> & Required<Pick<ConfigurationParameter, 'type'>> = {
        type: 'float',
    }
): ConfigurationParameter {
    if (parameter.type === 'float' || parameter.type === 'int') {
        return {
            value: 0,
            key: 'mocked_parameter',
            name: 'Mocked Parameter',
            maxValue: 100,
            minValue: 0,
            description: 'This is a mocked configuration parameter',
            defaultValue: 50,
            ...parameter,
        };
    }

    if (parameter.type === 'bool') {
        return {
            value: false,
            key: 'mocked_bool_parameter',
            name: 'Mocked Bool Parameter',
            description: 'This is a mocked boolean configuration parameter',
            defaultValue: false,
            ...parameter,
        };
    }

    if (parameter.type === 'enum') {
        return {
            allowedValues: [100, 200],
            defaultValue: 100,
            name: 'Mocked Enum Parameter',
            description: 'This is a mocked enum configuration parameter',
            value: 100,
            key: 'mocked_enum_parameter',
            ...parameter,
        };
    }

    throw new Error(`Unsupported parameter type: ${parameter.type}`);
}
