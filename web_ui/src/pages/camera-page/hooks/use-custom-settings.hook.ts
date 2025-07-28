// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useState } from 'react';

import { DeviceConfiguration } from '../providers/util';

type UseCustomSettings = {
    isMirrored: boolean;
    mirrorOption: DeviceConfiguration;
};

export const useCustomSettings = (): UseCustomSettings => {
    const [isMirrored, setIsMirrored] = useState(false);

    const mirrorOption = {
        name: 'Mirror camera',
        config: {
            type: 'selection',
            options: ['Off', 'On'],
            value: isMirrored ? 'On' : 'Off',
            defaultValue: 'Off',
        },
        onChange: (value: number | string) => {
            setIsMirrored(value === 'On');
        },
    } satisfies DeviceConfiguration;

    return {
        isMirrored,
        mirrorOption,
    };
};
