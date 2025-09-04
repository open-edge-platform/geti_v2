// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ComponentProps, ReactNode, RefObject } from 'react';

import { ActionButton, Button, CustomPopover, Divider, Flex, Popover, Text, View } from '@geti/ui';
import { Close } from '@geti/ui/icons';
import { isFunction } from 'lodash-es';

import { FUX_NOTIFICATION_KEYS } from '../../../core/user-settings/dtos/user-settings.interface';
import { useDocsUrl } from '../../../hooks/use-docs-url/use-docs-url.hook';
import { openNewTab } from '../../utils';
import { onPressLearnMore } from '../tutorials/utils';
import { getFuxNotificationData } from './utils';

import classes from './fux-notification.module.scss';

interface CustomPopoverProps extends Omit<ComponentProps<typeof Popover>, 'triggerRef' | 'children'> {
    settingsKey: FUX_NOTIFICATION_KEYS;
    customDocUrl?: string;
    children?: ReactNode;
    triggerRef: RefObject<null>;
    onClose?: () => void;
}

export const FuxNotification = ({
    settingsKey,
    customDocUrl,
    placement,
    triggerRef,
    state,
    onClose,
    children,
}: CustomPopoverProps) => {
    const { description, showDismissAll, docUrl } = getFuxNotificationData(settingsKey);
    const message = children ? children : description;
    const url = useDocsUrl();
    const newDocUrl = customDocUrl ?? (docUrl && `${url}${docUrl}`) ?? undefined;
    if (!showDismissAll) {
        return (
            <CustomPopover
                ref={triggerRef}
                hideArrow={false}
                placement={placement}
                state={state}
                UNSAFE_className={classes.container}
                isKeyboardDismissDisabled
            >
                <View UNSAFE_className={classes.dialogWrapper}>
                    <Text UNSAFE_className={classes.dialogDescription}>{message}</Text>
                    {newDocUrl && (
                        <Button
                            variant='primary'
                            id={`${settingsKey}-learn-more-button-id`}
                            onPress={() => {
                                onPressLearnMore(newDocUrl);
                            }}
                            marginStart={'size-300'}
                            UNSAFE_style={{ border: 'none' }}
                        >
                            Learn more
                        </Button>
                    )}

                    <Divider orientation='vertical' size='S' UNSAFE_className={classes.fuxDivider} />
                    <ActionButton
                        isQuiet
                        onPress={() => {
                            state.close();
                            isFunction(onClose) && onClose();
                        }}
                        aria-label={'Dismiss help dialog'}
                        UNSAFE_className={classes.close}
                    >
                        <Close />
                    </ActionButton>
                </View>
            </CustomPopover>
        );
    }
    // todo: not implemented anywhere yet, to do in next PR
    return (
        <CustomPopover
            ref={triggerRef}
            hideArrow={false}
            placement={placement}
            state={state}
            UNSAFE_className={classes.container}
            isKeyboardDismissDisabled
        >
            <Flex direction={'row'} gap={'size-200'} alignItems={'center'}>
                <Text order={1}>{children}</Text>

                {newDocUrl && (
                    <Button
                        order={2}
                        variant='primary'
                        UNSAFE_style={{ border: 'none' }}
                        onPress={() => openNewTab(newDocUrl)}
                    >
                        Learn more
                    </Button>
                )}

                <Divider order={3} orientation='vertical' size='S' UNSAFE_className={classes.divider} />

                <ActionButton
                    isQuiet
                    order={4}
                    onPress={() => {
                        state.close();
                        isFunction(onClose) && onClose();
                    }}
                    aria-label={'close first user experience notification'}
                    UNSAFE_className={classes.close}
                >
                    <Close />
                </ActionButton>
            </Flex>
        </CustomPopover>
    );
};
