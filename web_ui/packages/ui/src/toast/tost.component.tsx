// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { CSSProperties } from 'react';

import { toast as soonerToast, Toaster } from 'sonner';

import { AcceptCircle, CrossCircle } from '../../icons';

import classes from './toast.module.scss';

type ToastType = 'success' | 'error';

const DEFAULT_TIME_ON_SCREEN = 5000;

export const toast = (type: ToastType, text: string) => {
    switch (type) {
        case 'success':
            soonerToast.success(text, {
                unstyled: true,
                style: {
                    '--border-color': 'var(--moss-tint-1)',
                } as CSSProperties,
            });
            break;

        case 'error':
            soonerToast.error(text, {
                unstyled: true,
                style: {
                    '--border-color': 'var(--brand-coral-cobalt)',
                } as CSSProperties,
            });
            break;
    }
};

export const Toast = () => {
    return (
        <Toaster
            position='bottom-center'
            duration={DEFAULT_TIME_ON_SCREEN}
            closeButton={true}
            icons={{
                error: <CrossCircle color={'var(--brand-coral-cobalt)'} />,
                success: <AcceptCircle color={'var(--moss-tint-1)'} />,
            }}
            toastOptions={{
                classNames: {
                    toast: classes.toast,
                    closeButton: classes.closeButton,
                    icon: classes.icon,
                    content: classes.content,
                },
            }}
        />
    );
};
