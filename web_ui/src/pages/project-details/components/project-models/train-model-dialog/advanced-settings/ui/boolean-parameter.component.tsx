// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC } from 'react';

import { Switch } from '@geti/ui';

interface BooleanParameterProps {
    value: boolean;
    header: string;
    onChange: (isSelected: boolean) => void;
    isDisabled?: boolean;
}

export const BooleanParameter: FC<BooleanParameterProps> = ({ value, header, onChange, isDisabled }) => {
    return (
        <Switch
            isEmphasized
            isSelected={value}
            aria-label={`Toggle ${header}`}
            onChange={onChange}
            isDisabled={isDisabled}
        >
            {value ? 'On' : 'Off'}
        </Switch>
    );
};
