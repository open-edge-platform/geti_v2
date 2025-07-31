// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Key } from 'react';

import { Selection } from '@geti/ui';
import { uniq } from 'lodash-es';

import { getIds } from '../../../../../shared/utils';

export interface PreviewFile {
    id: string;
    file: File;
    labelIds: string[];
}

export enum SortingOptions {
    LABEL_NAME_A_Z = 'labelNameAtoZ',
    LABEL_NAME_Z_A = 'labelNameZtoA',
}

export const getSelectedLabelIds = (currentFiles: PreviewFile[], selectedKeys: Set<Key>) => {
    return currentFiles.reduce<string[]>((accumulator, current) => {
        if (selectedKeys.has(current.id)) {
            return [...accumulator, ...current.labelIds];
        }
        return accumulator;
    }, []);
};

export const updateLabels = (selectedKeys: Selection, newLabelIds: string[]) => (item: PreviewFile) => {
    const finalLabelIds =
        newLabelIds.length <= item.labelIds.length ? newLabelIds : uniq([...item.labelIds, ...newLabelIds]);

    if (selectedKeys === 'all' || selectedKeys.has(item.id)) {
        return { ...item, labelIds: finalLabelIds };
    }
    return item;
};

export const toggleSelection =
    (currentFiles: PreviewFile[]) =>
    (selectedItems: Selection): Selection => {
        if (selectedItems === 'all') {
            return new Set();
        }

        const allItemsSelected = selectedItems.size === currentFiles.length;
        const someItemsSelected = selectedItems.size > 0 && !allItemsSelected;

        if (selectedItems.size === 0 || someItemsSelected) {
            return new Set(getIds(currentFiles));
        }

        return new Set();
    };
