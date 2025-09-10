// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Key } from 'react';

import {
    ActionButton,
    Icon,
    Item,
    Menu,
    MenuTrigger as SpectrumMenuTrigger,
    Text,
    Tooltip,
    TooltipTrigger,
} from '@geti/ui';
import { MoreMenu } from '@geti/ui/icons';

import { MenuAction } from './menu-action.interface';

interface ActionMenuProps<T> {
    id?: string;
    items: MenuAction<T>[];
    disabledKeys?: string[];
    onAction: (key: Key) => void;
    tooltipMessage?: string;
    ariaLabel?: string;
    grayedOutKeys?: Key[];
}

export const ActionMenu = <T extends string>({
    id,
    items,
    disabledKeys,
    onAction,
    ariaLabel = 'action menu',
    tooltipMessage = 'More',
    grayedOutKeys,
}: ActionMenuProps<T>) => {
    const isGrayedOut = (name: string) => grayedOutKeys?.includes(name);
    return (
        <SpectrumMenuTrigger>
            <TooltipTrigger placement={'bottom'}>
                <ActionButton isQuiet id={id} data-testid={id} aria-label={ariaLabel}>
                    <MoreMenu />
                </ActionButton>
                <Tooltip>{tooltipMessage}</Tooltip>
            </TooltipTrigger>
            <Menu onAction={onAction} disabledKeys={disabledKeys} items={items}>
                {(item) => {
                    return (
                        <Item textValue={item.name}>
                            <Text
                                UNSAFE_style={
                                    isGrayedOut(item.name)
                                        ? { color: 'var(--spectrum-global-color-gray-400)' }
                                        : undefined
                                }
                            >
                                {item.name}
                            </Text>
                            {item.icon && <Icon>{item.icon}</Icon>}
                        </Item>
                    );
                }}
            </Menu>
        </SpectrumMenuTrigger>
    );
};
