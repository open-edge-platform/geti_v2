// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Dispatch, Key, ReactNode, SetStateAction } from 'react';

import { Item, Menu, MenuTrigger, Tooltip, TooltipTrigger } from '@adobe/react-spectrum';
import { capitalize } from 'lodash-es';

import { Grid, GridMedium, GridSmall, List } from '../../icons';
import { ActionButton } from '../button/button.component';
import { VIEW_MODE_LABEL, ViewModes } from './utils';

const ITEMS = [ViewModes.LARGE, ViewModes.MEDIUM, ViewModes.SMALL, ViewModes.DETAILS];

const ICON_PER_MODE: Record<ViewModes, ReactNode> = {
    [ViewModes.DETAILS]: <List />,
    [ViewModes.SMALL]: <GridSmall />,
    [ViewModes.MEDIUM]: <GridMedium />,
    [ViewModes.LARGE]: <Grid />,
};

interface MediaViewModesProps {
    items?: ViewModes[];
    isDisabled?: boolean;
    viewMode: ViewModes;
    setViewMode: Dispatch<SetStateAction<ViewModes>>;
}

export const MediaViewModes = ({ items = ITEMS, isDisabled = false, viewMode, setViewMode }: MediaViewModesProps) => {
    const handleAction = (key: Key): void => {
        const convertedKeyToViewMode = capitalize(String(key));

        if (convertedKeyToViewMode === viewMode) {
            return;
        }

        setViewMode(convertedKeyToViewMode as ViewModes);
    };

    return (
        <MenuTrigger>
            <TooltipTrigger placement='bottom'>
                <ActionButton isQuiet isDisabled={isDisabled} aria-label='View mode'>
                    {ICON_PER_MODE[viewMode]}
                </ActionButton>
                <Tooltip>{VIEW_MODE_LABEL}</Tooltip>
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
