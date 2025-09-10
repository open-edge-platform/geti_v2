// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ComponentProps } from 'react';

import { ToggleButton, type SpectrumToggleButtonProps } from '@geti/ui';

import sharedClasses from '../../shared.module.scss';

interface QuietToggleButtonProps extends SpectrumToggleButtonProps {
    ref?: ComponentProps<typeof ToggleButton>['ref'];
}

export const QuietToggleButton = (props: QuietToggleButtonProps) => (
    <ToggleButton
        isQuiet
        {...props}
        UNSAFE_className={`${sharedClasses.actionButtonDark} ${props.UNSAFE_className ?? ''}`}
    />
);
