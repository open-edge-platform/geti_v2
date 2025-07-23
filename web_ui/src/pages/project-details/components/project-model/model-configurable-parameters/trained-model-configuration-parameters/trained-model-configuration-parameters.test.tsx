// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { screen } from '@testing-library/react';

import { isConfigurationParameter } from '../../../../../../core/configurable-parameters/utils';
import {
    getMockedConfigurationParameter,
    getMockedTrainedModelConfigurationParameters,
} from '../../../../../../test-utils/mocked-items-factory/mocked-configuration-parameters';
import { providersRender as render } from '../../../../../../test-utils/required-providers-render';
import { TrainedModelConfigurationParametersList } from './trained-model-configuration-parameters.component';

const expectParameterToHaveValue = (name: string, value: number | string | boolean) => {
    if (typeof value === 'boolean') {
        expect(screen.getByLabelText(name)).toHaveTextContent(value ? 'On' : 'Off');
    } else {
        expect(screen.getByLabelText(name)).toHaveTextContent(value.toString());
    }
};

describe('TrainedModelConfigurationParameters', () => {
    it('displays learning parameters', () => {
        const learningParameters = [
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
            getMockedConfigurationParameter({
                type: 'enum',
                allowedValues: [256, 512, 1024],
                value: 512,
                defaultValue: 256,
                key: 'input_size_width',
                name: 'Input size width',
            }),
            getMockedConfigurationParameter({
                type: 'enum',
                allowedValues: [256, 512, 1024],
                value: 512,
                defaultValue: 256,
                key: 'input_size_height',
                name: 'Input size height',
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

        const parameters = getMockedTrainedModelConfigurationParameters({
            training: learningParameters,
        });

        render(<TrainedModelConfigurationParametersList parameters={parameters} />);

        expect(screen.getByRole('tab', { name: 'Training' })).toBeInTheDocument();

        learningParameters.forEach((parameter) => {
            if (isConfigurationParameter(parameter)) {
                expectParameterToHaveValue(parameter.name, parameter.value);
            } else {
                Object.values(parameter).forEach((subParameter) => {
                    if (isConfigurationParameter(subParameter)) {
                        expectParameterToHaveValue(subParameter.name, subParameter.value);
                    }
                });
            }
        });
    });

    it('does not display learning parameters when they are not present', () => {
        const parameters = getMockedTrainedModelConfigurationParameters({
            training: [],
        });

        render(<TrainedModelConfigurationParametersList parameters={parameters} />);

        expect(screen.queryByRole('tab', { name: 'Training' })).not.toBeInTheDocument();
    });

    it('displays data management parameters', () => {
        const tilingParameters = [
            getMockedConfigurationParameter({
                key: 'enable',
                type: 'bool',
                name: 'Enable tiling',
                value: true,
                description: 'Whether to apply tiling to the image',
                defaultValue: false,
            }),
            getMockedConfigurationParameter({
                key: 'adaptive_tiling',
                type: 'bool',
                name: 'Adaptive tiling',
                value: true,
                description: 'Whether to use adaptive tiling based on image content',
                defaultValue: false,
            }),
            getMockedConfigurationParameter({
                key: 'tile_size',
                type: 'int',
                name: 'Tile size',
                value: 256,
                description: 'Size of each tile in pixels',
                defaultValue: 128,
                maxValue: null,
                minValue: 0,
            }),
            getMockedConfigurationParameter({
                key: 'tile_overlap',
                type: 'int',
                name: 'Tile overlap',
                value: 64,
                description: 'Overlap between adjacent tiles in pixels',
                defaultValue: 64,
                maxValue: null,
                minValue: 0,
            }),
        ];

        const parameters = getMockedTrainedModelConfigurationParameters({
            datasetPreparation: {
                augmentation: {
                    tiling: tilingParameters,
                },
            },
        });

        render(<TrainedModelConfigurationParametersList parameters={parameters} />);

        expect(screen.getByRole('tab', { name: 'Data management' })).toBeInTheDocument();

        expect(screen.getByLabelText('Tiling mode')).toHaveTextContent('Automatic');

        tilingParameters.slice(2).forEach((parameter) => {
            expectParameterToHaveValue(parameter.name, parameter.value);
        });
    });

    it('does not display data management parameters when they are not present', () => {
        const parameters = getMockedTrainedModelConfigurationParameters({
            datasetPreparation: {
                augmentation: {},
            },
        });

        render(<TrainedModelConfigurationParametersList parameters={parameters} />);

        expect(screen.queryByRole('tab', { name: 'Data management' })).not.toBeInTheDocument();
    });
});
