// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactElement, ReactNode } from 'react';

import { Flex, Text, View } from '@adobe/react-spectrum';
import { clsx } from 'clsx';
import { isEmpty } from 'lodash-es';
import { toast as soonerToast, Toaster } from 'sonner';

import { AcceptCircle, Alert, CloseSmall, CrossCircle, Info } from '../../icons';
import { ActionButton } from '../button/button.component';
import { Divider } from '../divider/divider.component';

import classes from './toast.module.scss';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'neutral';

type ToastProps = {
    id?: string | number;
    type: ToastType;
    actionButtons?: ReactElement[];
    hasCloseButton?: boolean;
    duration?: number;
    onDismiss?: () => void;
    message: ReactNode;
};

type CustomToastProps = {
    id: string;
    type: ToastType;
    message: ReactNode;
    actionButtons?: ReactElement[];
    hasCloseButton?: boolean;
};

const ICON: Record<ToastType, ReactNode> = {
    success: <AcceptCircle />,
    error: <CrossCircle />,
    warning: <Alert />,
    info: <Info />,
    neutral: null,
};

const CustomToast = ({ message, id, actionButtons, type, hasCloseButton = true }: CustomToastProps) => {
    const TOAST_TYPE_STYLES = classes[type];

    return (
        <div aria-label={'toast'} className={clsx(TOAST_TYPE_STYLES, classes.toast)}>
            <Flex width={'100%'} height={'100%'} justifyContent={'space-between'} alignItems={'center'}>
                <Flex gap={'size-100'} alignItems={'center'}>
                    <View>{ICON[type]}</View>
                    <Text>{message}</Text>
                </Flex>

                <Flex height={'100%'}>
                    {!isEmpty(actionButtons) && <Flex alignItems={'center'}>{actionButtons}</Flex>}
                    {hasCloseButton && (
                        <Flex height={'100%'} alignItems={'center'} gap={'size-50'}>
                            <Divider
                                orientation={'vertical'}
                                height={'size-400'}
                                size={'S'}
                                UNSAFE_className={classes.toastDivider}
                            />
                            <ActionButton
                                isQuiet
                                onPress={() => soonerToast.dismiss(id)}
                                aria-label={'Close toast'}
                                UNSAFE_className={classes.closeButton}
                            >
                                <CloseSmall className={classes.closeIcon} />
                            </ActionButton>
                        </Flex>
                    )}
                </Flex>
            </Flex>
        </div>
    );
};

const DEFAULT_TOAST_DURATION = 8000;

export const removeToast = (id: string | number) => {
    soonerToast.dismiss(id);
};

export const removeToasts = () => {
    const toasts = soonerToast.getToasts();
    toasts.forEach((toast) => {
        soonerToast.dismiss(toast.id);
    });
};

export const toast = ({
    id,
    message,
    actionButtons,
    hasCloseButton,
    type,
    duration = DEFAULT_TOAST_DURATION,
    onDismiss,
}: ToastProps) => {
    const toastId = id !== undefined ? `id-${id}` : `id-${message}`;

    return soonerToast.custom(
        () => {
            return (
                <CustomToast
                    id={toastId}
                    type={type}
                    message={message}
                    actionButtons={actionButtons}
                    hasCloseButton={hasCloseButton}
                />
            );
        },
        {
            id: toastId,
            duration,
            onDismiss,
        }
    );
};

export const Toast = () => {
    return <Toaster position='bottom-center' />;
};
