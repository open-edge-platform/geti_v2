// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ComponentProps, ReactNode } from 'react';

import { DimensionValue, View } from '@adobe/react-spectrum';
import { type Responsive } from '@react-types/shared';
import { ListBox as AriaComponentsListBox, ListBoxItem, Virtualizer } from 'react-aria-components';

import { HorizontalLayout, HorizontalLayoutOptions } from './horizontal-layout';

import classes from './virtualized-horizontal-grid.module.scss';

interface VirtualizedHorizontalGridProps<T> {
    items: T[];
    height?: Responsive<DimensionValue>;
    renderItem: (item: T) => ReactNode;
    idFormatter: (item: T) => string;
    textValueFormatter: (item: T) => string;
    layoutOptions: HorizontalLayoutOptions;
    listBoxItemStyles?: ComponentProps<typeof ListBoxItem>['style'];
}

export const VirtualizedHorizontalGrid = <T,>({
    items,
    height = '100%',
    renderItem,
    idFormatter,
    textValueFormatter,
    layoutOptions,
    listBoxItemStyles,
}: VirtualizedHorizontalGridProps<T>) => {
    return (
        <View position={'relative'} width={'100%'} height={height}>
            <Virtualizer<HorizontalLayoutOptions> layout={HorizontalLayout} layoutOptions={layoutOptions}>
                <AriaComponentsListBox className={classes.container} orientation='horizontal'>
                    {items.map((item) => {
                        const id = idFormatter(item);

                        return (
                            <ListBoxItem
                                id={id}
                                key={id}
                                textValue={textValueFormatter(item)}
                                style={listBoxItemStyles}
                            >
                                {renderItem(item)}
                            </ListBoxItem>
                        );
                    })}
                </AriaComponentsListBox>
            </Virtualizer>
        </View>
    );
};
