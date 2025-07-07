// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import {
    getMockedConfigurationParameter,
    getMockedTrainingConfiguration,
} from '../../../test-utils/mocked-items-factory/mocked-configuration-parameters';
import { getTrainingConfigurationUpdatePayloadDTO } from './utils';

describe('getTrainingConfigurationUpdatePayloadDTO', () => {
    it('does not include parameters if they are empty', () => {
        const trainingConfiguration = getMockedTrainingConfiguration({
            taskId: 'hello',
            training: [],
            datasetPreparation: {
                subsetSplit: [],
                augmentation: {},
                filtering: {},
            },
            evaluation: [],
        });

        expect(getTrainingConfigurationUpdatePayloadDTO(trainingConfiguration)).toEqual({
            task_id: trainingConfiguration.taskId,
        });
    });

    it('returns correct payload for training configuration with parameters', () => {
        const trainingConfiguration = getMockedTrainingConfiguration({
            taskId: 'hello',
            training: [
                getMockedConfigurationParameter({
                    key: 'param1',
                    value: 10,
                    type: 'int',
                }),
                getMockedConfigurationParameter({
                    key: 'param2',
                    value: true,
                    type: 'bool',
                }),
                {
                    yolo: [
                        getMockedConfigurationParameter({
                            key: 'param3',
                            value: true,
                            type: 'bool',
                        }),
                        getMockedConfigurationParameter({
                            key: 'param4',
                            value: true,
                            type: 'bool',
                        }),
                    ],
                },
            ],
            datasetPreparation: {
                subsetSplit: [
                    getMockedConfigurationParameter({
                        key: 'split_ratio',
                        value: 0.8,
                        type: 'float',
                    }),
                ],
                augmentation: {
                    center_crop: [
                        getMockedConfigurationParameter({
                            key: 'crop_size',
                            value: 224,
                            type: 'int',
                        }),
                    ],
                },
                filtering: {
                    min_size: [
                        getMockedConfigurationParameter({
                            key: 'min_size',
                            value: 32,
                            type: 'int',
                        }),
                    ],
                },
            },
            evaluation: [],
        });

        expect(getTrainingConfigurationUpdatePayloadDTO(trainingConfiguration)).toEqual({
            task_id: trainingConfiguration.taskId,
            training: [
                { key: 'param1', value: 10 },
                { key: 'param2', value: true },
                {
                    yolo: [
                        { key: 'param3', value: true },
                        { key: 'param4', value: true },
                    ],
                },
            ],
            dataset_preparation: {
                subset_split: [{ key: 'split_ratio', value: 0.8 }],
                augmentation: {
                    center_crop: [{ key: 'crop_size', value: 224 }],
                },
                filtering: {
                    min_size: [{ key: 'min_size', value: 32 }],
                },
            },
        });
    });
});
