// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Dispatch, Key, SetStateAction } from 'react';

import { Item, Menu, MenuTrigger, Tooltip, TooltipTrigger } from '@adobe/react-spectrum';
import { capitalize } from 'lodash-es';

import { Grid, GridMedium, GridSmall, List } from '../../icons';
import { ActionButton } from '../button/button.component';
import { ViewModeOptions } from './utils';

const ITEMS = [ViewModeOptions.LARGE, ViewModeOptions.MEDIUM, ViewModeOptions.SMALL, ViewModeOptions.DETAILS];

const ICON_PER_MODE: Record<ViewModeOptions, JSX.Element> = {
    [ViewModeOptions.DETAILS]: <List />,
    [ViewModeOptions.SMALL]: <GridSmall />,
    [ViewModeOptions.MEDIUM]: <GridMedium />,
    [ViewModeOptions.LARGE]: <Grid />,
};

interface ViewModesProps {
    items?: ViewModeOptions[];
    isDisabled?: boolean;
    viewMode: ViewModeOptions;
    setViewMode: Dispatch<SetStateAction<ViewModeOptions>>;
}

export const ViewModes = ({ items = ITEMS, isDisabled = false, viewMode, setViewMode }: ViewModesProps) => {
    const handleAction = (key: Key): void => {
        const convertedKeyToViewMode = capitalize(String(key));

        if (convertedKeyToViewMode === viewMode) {
            return;
        }

        setViewMode(convertedKeyToViewMode as ViewModeOptions);
    };

    return (
        <MenuTrigger>
            <TooltipTrigger placement='bottom'>
                <ActionButton isQuiet isDisabled={isDisabled}>
                    {ICON_PER_MODE[viewMode]}
                </ActionButton>
                <Tooltip>View modes camilo</Tooltip>
            </TooltipTrigger>
            <Menu
                items={items}
                selectionMode='single'
                onAction={handleAction}
                selectedKeys={[viewMode.toLocaleLowerCase()]}
            >
                {items.map((item: string) => (
                    <Item key={item.toLocaleLowerCase()} aria-label={item.toLocaleLowerCase()} textValue={item}>
                        {item}
                    </Item>
                ))}
            </Menu>
        </MenuTrigger>
    );
};
