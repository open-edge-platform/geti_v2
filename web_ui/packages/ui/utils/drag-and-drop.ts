// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { type SpectrumDropZoneProps as DropZoneProps } from '@geti/ui';

import { GetElementType } from './types';

type DropItem = GetElementType<DropEvent['items']>;
type DropEvent = Parameters<NonNullable<DropZoneProps['onDrop']>>[0];

const toArray = async <T>(asyncIterator: AsyncIterable<T>): Promise<T[]> => {
    const arr: T[] = [];
    for await (const i of asyncIterator) arr.push(i);
    return arr;
};

const flattenDropItemToFiles = async (item: DropItem): Promise<File[]> => {
    if (item.kind === 'file') {
        return [file];
    }

    if (item.kind === 'text') {
        return [];
    }

    const entries: DropItem[] = await toArray(item.getEntries());

    const filesFromDirectory: File[] = [];
    for await (const entry of entries) {
        if (entry.kind === 'directory') {
            filesFromDirectory.push(...(await flattenDropItemToFiles(entry)));
        } else if (entry.kind === 'file') {
            filesFromDirectory.push(await entry.getFile());
        }
    }

    return filesFromDirectory;
};

export const getFilesFromDropEvent = async (e: DropEvent): Promise<File[]> => {
    const files: File[] = [];
    for await (const item of e.items) {
        files.push(...(await flattenDropItemToFiles(item)));
    }

    return files;
};
