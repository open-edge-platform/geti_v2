// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ComponentProps } from 'react';

import {
    CustomTabItem,
    CustomTabItemProps,
} from '../../../../shared/components/custom-tab-item/custom-tab-item.component';
import { MenuTriggerButton } from '../../../../shared/components/menu-trigger/menu-trigger-button/menu-trigger-button.component';

import classes from '../../../../shared/components/custom-tab-item/custom-tab-item.module.scss';

type CustomTabItemWithMenuProps = CustomTabItemProps &
    Pick<
        ComponentProps<typeof MenuTriggerButton>,
        'items' | 'ariaLabel' | 'id' | 'onAction' | 'onOpenChange' | 'disabledKeys'
    >;

export const TabItemWithMenu = ({
    items,
    ariaLabel,
    id,
    onAction,
    onOpenChange,
    name,
    isMoreIconVisible,
    disabledKeys,
}: CustomTabItemWithMenuProps): JSX.Element => {
    return (
        <MenuTriggerButton
            isQuiet
            id={id}
            items={items}
            onAction={onAction}
            ariaLabel={ariaLabel}
            onOpenChange={onOpenChange}
            disabledKeys={disabledKeys}
            customTriggerContent={<CustomTabItem name={name} isMoreIconVisible={isMoreIconVisible} />}
            menuTriggerClasses={classes.customTabItemMenuTrigger}
        />
    );
};
