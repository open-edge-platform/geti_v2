// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ConfigurationParameter } from '../../../../../../core/configurable-parameters/services/configuration.interface';

const getDecimalPoints = (value: number): number => {
    return Math.abs(Math.ceil(Math.log10(value)));
};

export const getFloatingPointStep = (minValue: number, maxValue: number): number => {
    const exponent = getDecimalPoints(maxValue - minValue);

    return 1 / Math.pow(10, exponent + 3);
};

export const isBoolEnableParameter = (parameter: ConfigurationParameter) => {
    return parameter.type === 'bool' && parameter.key === 'enable';
};
