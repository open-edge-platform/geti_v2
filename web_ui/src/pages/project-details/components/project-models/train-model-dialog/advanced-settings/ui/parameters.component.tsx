// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC, ReactNode } from 'react';

import { Grid, minmax, Text, ToggleButtons, View } from '@geti/ui';
import { isBoolean, isFunction } from 'lodash-es';

import { ConfigurationParameter } from '../../../../../../../core/configurable-parameters/services/configuration.interface';
import { isBoolEnableParameter } from '../utils';
import { BooleanParameter } from './boolean-parameter.component';
import { NumberParameterField } from './number-parameter-field.component';
import { ResetButton } from './reset-button.component';
import { Tooltip } from './tooltip.component';

interface ParametersProps {
    parameters: ConfigurationParameter[];
    onChange: (parameter: ConfigurationParameter) => void;
    isReadOnly?: boolean;
}

const ParameterTooltip: FC<{ text: string }> = ({ text }) => {
    return <Tooltip>{text}</Tooltip>;
};

interface ParameterProps {
    parameter: ConfigurationParameter;
    onChange: (parameter: ConfigurationParameter) => void;
    isDisabled?: boolean;
    marginStart?: string;
    isReadOnly: boolean;
}

interface ParameterFieldProps {
    parameter: ConfigurationParameter;
    onChange: (parameter: ConfigurationParameter) => void;
    isDisabled?: boolean;
}

interface ParameterLayoutProps {
    header: string;
    description: string;
    onReset?: () => void;
    children: ReactNode;
    marginStart?: string;
}

interface ParameterNameProps {
    name: string;
    description: string;
    gridColumn?: string;
    marginStart?: string;
}

export const ParameterName = ({ name, description, marginStart, gridColumn }: ParameterNameProps) => {
    return (
        <Text marginStart={marginStart} gridColumn={gridColumn}>
            {name}
            <ParameterTooltip text={description} />
        </Text>
    );
};

const ParameterLayout: FC<ParameterLayoutProps> = ({ header, children, description, onReset, marginStart }) => {
    return (
        <>
            <ParameterName name={header} description={description} gridColumn={'1/2'} marginStart={marginStart} />
            <View gridColumn={'2/3'}>{children}</View>
            {isFunction(onReset) && <ResetButton onPress={onReset} aria-label={`Reset ${header}`} />}
        </>
    );
};

interface ParameterReadOnlyProps {
    parameter: Pick<ConfigurationParameter, 'value' | 'name' | 'description'>;
    marginStart?: string;
}

interface ParameterReadOnlyValueProps {
    value: Pick<ConfigurationParameter, 'value'>['value'];
}

export const ParameterReadOnlyValue = ({ value }: ParameterReadOnlyValueProps) => {
    if (isBoolean(value)) {
        return <Text>{value ? 'On' : 'Off'}</Text>;
    }

    return <Text>{value}</Text>;
};

const ParameterReadOnly = ({ parameter, marginStart }: ParameterReadOnlyProps) => {
    return (
        <ParameterLayout header={parameter.name} description={parameter.description} marginStart={marginStart}>
            <ParameterReadOnlyValue value={parameter.value} />
        </ParameterLayout>
    );
};

const ParameterField: FC<ParameterFieldProps> = ({ parameter, onChange, isDisabled }) => {
    if (parameter.type === 'enum') {
        const handleChange = (value: string) => {
            onChange({
                ...parameter,
                value,
            });
        };
        return (
            <ToggleButtons
                options={parameter.allowedValues}
                selectedOption={parameter.value}
                onOptionChange={handleChange}
                isDisabled={isDisabled}
            />
        );
    }

    if (parameter.type === 'float' || parameter.type === 'int') {
        const handleChange = (value: number) => {
            onChange({
                ...parameter,
                value,
            });
        };

        return (
            <NumberParameterField
                value={parameter.value}
                minValue={parameter.minValue}
                maxValue={parameter.maxValue}
                onChange={handleChange}
                type={parameter.type}
                isDisabled={isDisabled}
                name={parameter.name}
            />
        );
    }

    if (parameter.type === 'bool') {
        const handleChange = (value: boolean) => {
            onChange({
                ...parameter,
                value,
            });
        };

        return (
            <BooleanParameter
                value={parameter.value}
                header={parameter.name}
                onChange={handleChange}
                isDisabled={isDisabled}
            />
        );
    }
};

export const Parameter = ({ parameter, onChange, isDisabled, marginStart, isReadOnly }: ParameterProps) => {
    if (isReadOnly) {
        return <ParameterReadOnly parameter={parameter} marginStart={marginStart} />;
    }

    const handleReset = () => {
        onChange({ ...parameter, value: parameter.defaultValue } as ConfigurationParameter);
    };

    return (
        <ParameterLayout
            header={parameter.name}
            description={parameter.description}
            onReset={handleReset}
            marginStart={marginStart}
        >
            <ParameterField parameter={parameter} onChange={onChange} isDisabled={isDisabled} />
        </ParameterLayout>
    );
};

interface ParametersListProps {
    parameters: ConfigurationParameter[];
    onChange: (parameter: ConfigurationParameter) => void;
    isReadOnly: boolean;
}

const ParametersList = ({ parameters, onChange, isReadOnly }: ParametersListProps) => {
    if (isBoolEnableParameter(parameters[0])) {
        return parameters.map((parameter, index) => (
            <Parameter
                key={parameter.name}
                parameter={parameter}
                onChange={onChange}
                isDisabled={index > 0 && !parameters[0].value}
                marginStart={index > 0 ? 'size-150' : undefined}
                isReadOnly={isReadOnly}
            />
        ));
    }

    return parameters.map((parameter) => (
        <Parameter key={parameter.name} parameter={parameter} onChange={onChange} isReadOnly={isReadOnly} />
    ));
};

export const Parameters = ({ parameters, onChange, isReadOnly = false }: ParametersProps) => {
    const columns = isReadOnly ? ['size-3000', '1fr'] : ['size-3000', minmax('size-3400', '1fr'), 'size-400'];

    return (
        <Grid columns={columns} gap={'size-300'} alignItems={'center'}>
            <ParametersList parameters={parameters} onChange={onChange} isReadOnly={isReadOnly} />
        </Grid>
    );
};
