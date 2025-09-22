// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactElement } from 'react';

import { type CellProps, type ColumnSize, type StyleProps } from '@geti/ui';

export interface ModelTableColumns<T> {
    label: string;
    width: ColumnSize;
    align?: 'start' | 'center' | 'end';
    component: (props: T) => ReactElement<CellProps>;
}

export interface ModelTableProps<T> extends StyleProps {
    data: T[];
    columns: ModelTableColumns<T>[];
}
