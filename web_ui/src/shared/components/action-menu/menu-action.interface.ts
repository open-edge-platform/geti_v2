// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactElement } from 'react';

export interface MenuAction<T> {
    name: T;
    id: string;
    icon?: ReactElement;
}
