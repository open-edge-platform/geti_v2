// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ComponentProps, Ref } from 'react';

import {
    ActionButton as SpectrumActionButton,
    SpectrumActionButtonProps,
    Button as SpectrumButton,
    SpectrumButtonProps,
} from '@adobe/react-spectrum';
import { FocusableRef, FocusableRefValue } from '@react-types/shared';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

import buttonClasses from './button.module.scss';

type VariantWithoutLegacyButtonVariant = Exclude<SpectrumButtonProps['variant'], 'cta' | 'overBackground'>;

export interface ButtonProps extends Omit<SpectrumButtonProps, 'variant'> {
    ref?: FocusableRef<HTMLButtonElement>;
    variant?: VariantWithoutLegacyButtonVariant;
}

// https://github.com/adobe/react-spectrum/blob/main/packages/%40react-aria/button/src/useButton.ts#L75
// This component builds up a link with a fixed `to` prop,
// this used so that it can be used as `elementTYpe={LinkBuilder(href)}` in a react/spectrum
// button component, which does not forward an href for custom element types
type LinkProps = ComponentProps<typeof Link>;

interface LinkBuilderProps {
    href: string;
    target?: LinkProps['target'];
    rel: LinkProps['rel'];
}

function LinkBuilder({ href, target, rel }: LinkBuilderProps) {
    return (props: LinkProps) => {
        return <Link {...props} target={target} rel={rel} to={href} />;
    };
}

export interface ActionButtonProps extends SpectrumActionButtonProps {
    ref?: Ref<FocusableRefValue<HTMLElement, HTMLButtonElement>>;
    colorVariant?: ActionButtonColorVariant;
}

type ActionButtonColorVariant = 'dark' | 'light' | 'blue';

const getActionButtonClass = (colorVariant: ActionButtonColorVariant = 'dark') => {
    const COLOR_VARIANTS: Record<ActionButtonColorVariant, string> = {
        dark: buttonClasses.actionButtonDark,
        light: buttonClasses.actionButtonLight,
        blue: buttonClasses.actionButtonBlue,
    };

    return COLOR_VARIANTS[colorVariant];
};

export const Button = (props: ButtonProps) => {
    const elementType =
        props.href === undefined
            ? props.elementType
            : LinkBuilder({ href: props.href, target: props.target, rel: props.rel });

    return <SpectrumButton {...props} elementType={elementType} variant={props.variant ?? 'accent'} />;
};

export const ActionButton = (props: ActionButtonProps) => {
    const { colorVariant, UNSAFE_className, ...rest } = props;
    const buttonClass = getActionButtonClass(colorVariant);

    return <SpectrumActionButton {...rest} UNSAFE_className={clsx(buttonClass, UNSAFE_className)} />;
};
