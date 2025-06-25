// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC, ReactNode } from 'react';

import { Grid, minmax, Text, ToggleButtons, View } from '@geti/ui';
import { isFunction } from 'lodash-es';

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

const ParameterLayout: FC<ParameterLayoutProps> = ({ header, children, description, onReset, marginStart }) => {
    const isResetButtonVisible = isFunction(onReset);

    return (
        <>
            <Text gridColumn={'1/2'} marginStart={marginStart}>
                {header}
                <ParameterTooltip text={description} />
            </Text>
            <View gridColumn={`${isResetButtonVisible ? '2/3' : '2/4'}`}>{children}</View>
            {isResetButtonVisible && <ResetButton onPress={onReset} aria-label={`Reset ${header}`} />}
        </>
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
        return (
            <ParameterLayout header={parameter.name} description={parameter.description} marginStart={marginStart}>
                <Text>{parameter.value}</Text>
            </ParameterLayout>
        );
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

Parameter.Layout = ParameterLayout;
Parameter.Field = ParameterField;

interface ParametersListProps {
    parameters: ConfigurationParameter[];
    onChange: (parameter: ConfigurationParameter) => void;
    isReadOnly: boolean;
}

const ParametersList = ({ parameters, onChange, isReadOnly }: ParametersListProps) => {
    if (isBoolEnableParameter(parameters[0])) {
        return (
            <ParametersContainer>
                {parameters.map((parameter, index) => (
                    <Parameter
                        key={parameter.name}
                        parameter={parameter}
                        onChange={onChange}
                        isDisabled={index > 0 && !parameters[0].value}
                        marginStart={index > 0 ? 'size-150' : undefined}
                        isReadOnly={isReadOnly}
                    />
                ))}
            </ParametersContainer>
        );
    }

    return parameters.map((parameter) => (
        <Parameter key={parameter.name} parameter={parameter} onChange={onChange} isReadOnly={isReadOnly} />
    ));
};

const ParametersContainer = ({ children }: { children: ReactNode }) => {
    return (
        <Grid columns={['size-3000', minmax('size-3400', '1fr'), 'size-400']} gap={'size-300'} alignItems={'center'}>
            {children}
        </Grid>
    );
};

export const Parameters = ({ parameters, onChange, isReadOnly = false }: ParametersProps) => {
    return (
        <ParametersContainer>
            <ParametersList parameters={parameters} onChange={onChange} isReadOnly={isReadOnly} />
        </ParametersContainer>
    );
};

Parameters.Container = ParametersContainer;
