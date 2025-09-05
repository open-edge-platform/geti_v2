// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Key, ReactElement, ReactNode } from 'react';

export interface MenuTriggerProps {
    id: string;
    items: string[];
    menuTooltip?: ReactNode;
    disabledKeys?: Key[];
    onAction: (key: Key) => void;
    selectedKey?: Iterable<string>;
    onOpenChange?: (isOpen: boolean) => void;
    renderContent?: (item: string) => ReactNode;
    children: ReactElement;
    ariaLabel?: string;
    grayedOutKeys?: Key[];
}

export enum MenuItemsKey {
    FILES = 'Files',
    FOLDER = 'Folder',
    CAMERA = 'Camera',
    FILE = 'File',
}
