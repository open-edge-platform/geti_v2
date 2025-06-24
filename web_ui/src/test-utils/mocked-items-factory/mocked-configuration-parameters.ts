// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import {
    ConfigurationParameter,
    ProjectConfiguration,
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
    training: [],
    datasetPreparation: {
        subsetSplit: [],
        augmentation: {},
        filtering: {},
    },
    taskId: '',
    advancedConfiguration: undefined,
    evaluation: [],
    ...config,
});

export const getMockedConfigurationParameter = (
    parameter: Partial<ConfigurationParameter> & Required<Pick<ConfigurationParameter, 'type'>> = {
        type: 'float',
    }
): ConfigurationParameter => {
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
            allowedValues: ['option1', 'option2'],
            defaultValue: 'option1',
            name: 'Mocked Enum Parameter',
            description: 'This is a mocked enum configuration parameter',
            value: 'option1',
            key: 'mocked_enum_parameter',
            ...parameter,
        };
    }

    throw new Error(`Unsupported parameter type: ${parameter.type}`);
};
