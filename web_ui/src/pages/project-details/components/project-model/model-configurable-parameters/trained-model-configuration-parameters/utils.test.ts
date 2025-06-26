// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { getMockedConfigurationParameter } from '../../../../../../test-utils/mocked-items-factory/mocked-configuration-parameters';
import { isLearningParameterModified } from './utils';

describe('isLearningParameterModified', () => {
    it('returns true for modified parameters', () => {
        expect(
            isLearningParameterModified([
                getMockedConfigurationParameter({
                    type: 'float',
                    defaultValue: 0.5,
                    value: 0.5,
                }),
                {
                    yolo: [
                        getMockedConfigurationParameter({
                            type: 'bool',
                            value: false,
                            defaultValue: true,
                        }),
                    ],
                },
            ])
        ).toBe(true);

        expect(
            isLearningParameterModified([
                getMockedConfigurationParameter({
                    type: 'float',
                    defaultValue: 0.5,
                    value: 0.7,
                }),
                {
                    yolo: [
                        getMockedConfigurationParameter({
                            type: 'bool',
                            value: false,
                            defaultValue: false,
                        }),
                    ],
                },
            ])
        ).toBe(true);
    });

    it('returns false for default parameters', () => {
        const parameters = [
            getMockedConfigurationParameter({
                type: 'float',
                defaultValue: 0.5,
                value: 0.5,
            }),
            {
                yolo: [
                    getMockedConfigurationParameter({
                        type: 'bool',
                        value: false,
                        defaultValue: false,
                    }),
                ],
            },
        ];

        expect(isLearningParameterModified(parameters)).toBe(false);
    });
});
