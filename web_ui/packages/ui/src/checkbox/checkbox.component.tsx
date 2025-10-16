// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import {
    Checkbox as SpectrumCheckBox,
    CheckboxGroup as SpectrumCheckboxGroup,
    SpectrumCheckboxGroupProps,
    SpectrumCheckboxProps,
} from '@adobe/react-spectrum';

export const Checkbox = (props: SpectrumCheckboxProps) => {
    return <SpectrumCheckBox {...props} />;
};

export const CheckboxGroup = (props: SpectrumCheckboxGroupProps) => {
    return <SpectrumCheckboxGroup {...props} />;
};
