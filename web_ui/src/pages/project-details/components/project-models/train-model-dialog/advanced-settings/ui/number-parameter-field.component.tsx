// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC, useEffect, useState } from 'react';

import { Flex, NumberField, Slider } from '@geti/ui';

import { NumberParameter } from '../../../../../../../core/configurable-parameters/services/configuration.interface';
import { getFloatingPointStep } from '../utils';

type NumberGroupParamsProps = Pick<NumberParameter, 'type' | 'value' | 'minValue' | 'maxValue'> & {
    onChange: (value: number) => void;
    isDisabled?: boolean;
};

const DEFAULT_INT_STEP = 1;
const DEFAULT_FLOAT_STEP = 0.1;

export const NumberParameterField: FC<NumberGroupParamsProps> = ({
    value,
    minValue,
    maxValue,
    type,
    onChange,
    isDisabled,
}) => {
    const [parameterValue, setParameterValue] = useState<number>(value);

    const floatingPointStep = maxValue === null ? DEFAULT_FLOAT_STEP : getFloatingPointStep(minValue, maxValue);

    const step = type === 'int' ? DEFAULT_INT_STEP : floatingPointStep;

    const handleValueChange = (inputValue: number): void => {
        setParameterValue(inputValue);
        onChange(inputValue);
    };

    useEffect(() => {
        setParameterValue(value);
    }, [value]);

    if (maxValue === null) {
        return (
            <NumberField
                step={step}
                value={parameterValue}
                minValue={minValue}
                onChange={handleValueChange}
                isDisabled={isDisabled}
            />
        );
    }

    return (
        <Flex gap={'size-100'}>
            <Slider
                value={parameterValue}
                minValue={minValue}
                maxValue={maxValue}
                onChange={setParameterValue}
                onChangeEnd={handleValueChange}
                step={step}
                isFilled
                flex={1}
                isDisabled={isDisabled}
            />
            <NumberField
                isQuiet
                step={step}
                value={parameterValue}
                minValue={minValue}
                maxValue={maxValue}
                onChange={handleValueChange}
                isDisabled={isDisabled}
            />
        </Flex>
    );
};
