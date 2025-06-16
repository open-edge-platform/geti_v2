// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC, useEffect, useState } from 'react';

import { Flex, NumberField, Slider } from '@geti/ui';

import { NumberParameter } from '../../../../../../../core/configurable-parameters/services/configuration.interface';
import { getFloatingPointStep } from '../utils';

type NumberGroupParamsProps = Pick<NumberParameter, 'type' | 'value' | 'minValue' | 'maxValue'> & {
    onChange: (value: number) => void;
};

const DEFAULT_STEP = 1;

export const NumberParameterField: FC<NumberGroupParamsProps> = ({ value, minValue, maxValue, type, onChange }) => {
    const [parameterValue, setParameterValue] = useState<number>(value);

    const floatingPointStep = maxValue === null ? DEFAULT_STEP : getFloatingPointStep(minValue, maxValue);

    const step = type === 'int' ? DEFAULT_STEP : floatingPointStep;

    const handleValueChange = (inputValue: number): void => {
        setParameterValue(inputValue);
    };

    const handleSliderChangeEnd = (inputValue: number): void => {
        setParameterValue(inputValue);
        onChange(inputValue);
    };

    useEffect(() => {
        setParameterValue(value);
    }, [value]);

    if (maxValue === null) {
        return <NumberField isQuiet step={step} value={value} minValue={minValue} onChange={handleValueChange} />;
    }

    return (
        <Flex gap={'size-100'}>
            <Slider
                value={parameterValue}
                minValue={minValue}
                maxValue={maxValue}
                onChange={handleValueChange}
                onChangeEnd={handleSliderChangeEnd}
                step={step}
                isFilled
                flex={1}
            />
            <NumberField
                isQuiet
                step={step}
                value={value}
                minValue={minValue}
                maxValue={maxValue}
                onChange={handleValueChange}
            />
        </Flex>
    );
};
