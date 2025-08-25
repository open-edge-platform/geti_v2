// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC, useEffect, useState } from 'react';

import { Flex, NumberField, Slider } from '@geti/ui';

import { NumberParameter } from '../../../../../../../core/configurable-parameters/services/configuration.interface';
import { getFloatingPointStep } from '../utils';

type NumberGroupParamsProps = Pick<NumberParameter, 'type' | 'value' | 'minValue' | 'maxValue' | 'name'> & {
    onChange: (value: number) => void;
    isDisabled?: boolean;
    step?: number;
};

const DEFAULT_INT_STEP = 1;
const DEFAULT_FLOAT_STEP = 0.1;

const getStep = ({
    step,
    maxValue,
    minValue,
    type,
}: {
    step?: number;
    minValue: number;
    maxValue: number | null;
    type: NumberParameter['type'];
}): number => {
    if (step !== undefined) {
        return step;
    }

    if (maxValue === null) {
        return type === 'int' ? DEFAULT_INT_STEP : DEFAULT_FLOAT_STEP;
    }

    return getFloatingPointStep(minValue, maxValue);
};

export const NumberParameterField: FC<NumberGroupParamsProps> = ({
    value,
    minValue,
    maxValue,
    type,
    onChange,
    isDisabled,
    name,
    step,
}) => {
    const [parameterValue, setParameterValue] = useState<number>(value);

    const fieldStep = getStep({ step, type, maxValue, minValue });
    const formatOptions = type === 'float' ? { maximumFractionDigits: Math.abs(Math.log10(fieldStep)) } : undefined;

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
                aria-label={`Change ${name}`}
                step={fieldStep}
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
                step={fieldStep}
                isFilled
                flex={1}
                isDisabled={isDisabled}
            />
            <NumberField
                isQuiet
                step={fieldStep}
                value={parameterValue}
                minValue={minValue}
                maxValue={maxValue}
                onChange={handleValueChange}
                isDisabled={isDisabled}
                aria-label={`Change ${name}`}
                formatOptions={formatOptions}
            />
        </Flex>
    );
};
