// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ActionButton, type ActionButtonProps } from '@geti/ui';

import classes from './label-shortcut-button.module.scss';

export const LabelShortcutButton = ({ children, id, onPress, UNSAFE_className, ref, ...rest }: ActionButtonProps) => {
    return (
        <ActionButton
            id={id}
            onPress={onPress}
            UNSAFE_className={`${
                rest.isDisabled ? classes.labelDisabledButton : classes.labelButton
            } ${UNSAFE_className}`}
            {...rest}
            ref={ref}
        >
            {children}
        </ActionButton>
    );
};
