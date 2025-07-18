// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Key } from 'react';

import { Icon, Item, Picker, Section, Text } from '@geti/ui';
import { SortDown, SortUp } from '@geti/ui/icons';

import styles from './sort-widget.module.scss';

interface SortItemType {
    key: string;
    name: string;
}
interface SortWidgetProps<T extends string> {
    sortBy: T;
    onSort: (option: T) => void;
    items: SortItemType[][] | SortItemType[];
    ariaLabel?: string;
}

interface SortItemProps {
    item: {
        key: string;
        name: string;
    };
}

const SortWidgetItem = ({ item }: SortItemProps) => {
    return (
        <>
            <Text>{item.name}</Text>
            <Icon>{item.key.toLocaleLowerCase().endsWith('asc') ? <SortUp /> : <SortDown />}</Icon>
        </>
    );
};

export const SortWidget = <T extends string>({ sortBy, onSort, items, ariaLabel }: SortWidgetProps<T>) => {
    return (
        <Picker
            isQuiet
            // @ts-expect-error Picker does not like having two possible types of items
            items={items}
            selectedKey={sortBy}
            onSelectionChange={(key: Key) => onSort(key as T)}
            aria-label={ariaLabel}
            UNSAFE_className={styles.sortWidget}
        >
            {(item) => {
                if (!Array.isArray(item)) {
                    return (
                        <Item key={item.key} textValue={item.name}>
                            <SortWidgetItem item={item} />
                        </Item>
                    );
                }

                return (
                    <Section key={`${item[0].key}-${item[1].key}`}>
                        {item.map((option) => (
                            <Item key={option.key} textValue={option.name}>
                                <SortWidgetItem item={option} />
                            </Item>
                        ))}
                    </Section>
                );
            }}
        </Picker>
    );
};
