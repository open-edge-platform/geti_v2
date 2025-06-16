// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC, ReactNode } from 'react';

import { Grid, minmax, Text, ToggleButtons, View } from '@geti/ui';
import { isFunction } from 'lodash-es';

import { ConfigurationParameter } from '../../../../../../../core/configurable-parameters/services/configuration.interface';
import { BooleanParameter } from './boolean-parameter.component';
import { NumberParameterField } from './number-parameter-field.component';
import { ResetButton } from './reset-button.component';
import { Tooltip } from './tooltip.component';

interface ParametersProps {
    parameters: ConfigurationParameter[];
    onChange: () => void;
}

const ParameterTooltip: FC<{ text: string }> = ({ text }) => {
    return <Tooltip>{text}</Tooltip>;
};

interface ParameterProps {
    parameter: ConfigurationParameter;
    onChange: () => void;
}

interface ParameterLayoutProps {
    header: string;
    description: string;
    onReset: () => void;
    children: ReactNode;
}

const ParameterLayout: FC<ParameterLayoutProps> = ({ header, children, description, onReset }) => {
    return (
        <>
            <Text gridColumn={'1/2'}>
                {header}
                <ParameterTooltip text={description} />
            </Text>
            <View gridColumn={'2/3'}>{children}</View>
            {isFunction(onReset) && <ResetButton onPress={onReset} aria-label={`Reset ${header}`} />}
        </>
    );
};

const ParameterField: FC<ParameterProps> = ({ parameter, onChange }) => {
    if (parameter.type === 'enum') {
        return (
            <ToggleButtons
                options={parameter.allowedValues}
                selectedOption={parameter.value}
                onOptionChange={onChange}
            />
        );
    }

    if (parameter.type === 'float' || parameter.type === 'int') {
        return (
            <NumberParameterField
                value={parameter.value}
                minValue={parameter.minValue}
                maxValue={parameter.maxValue}
                onChange={onChange}
                type={parameter.type}
            />
        );
    }

    if (parameter.type === 'bool') {
        return <BooleanParameter value={parameter.value} header={parameter.name} onChange={() => {}} />;
    }
};

const Parameter: FC<ParameterProps> = ({ parameter, onChange }) => {
    return (
        <ParameterLayout header={parameter.name} description={parameter.description} onReset={() => {}}>
            <ParameterField parameter={parameter} onChange={onChange} />
        </ParameterLayout>
    );
};

export const Parameters: FC<ParametersProps> = ({ parameters, onChange }) => {
    return (
        <Grid columns={['size-3000', minmax('size-3400', '1fr'), 'size-400']} gap={'size-300'} alignItems={'center'}>
            {parameters.map((parameter) => (
                <Parameter key={parameter.name} parameter={parameter} onChange={onChange} />
            ))}
        </Grid>
    );
};
