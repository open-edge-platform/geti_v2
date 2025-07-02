// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useState } from 'react';

import { DeviceConfiguration, SettingSelection } from '../providers/util';

export type Ratio = { numerator: number; denumerator: number };
const ratioTypes = ['Custom', '5/4', '4/3', '3/2', '16/9'] as const;
type RatioType = (typeof ratioTypes)[number];

type UseCustomSettings = {
    scale: Ratio | undefined;
    isMirrored: boolean;
    scaleOption: DeviceConfiguration;
    mirrorOption: DeviceConfiguration;
};

export const useCustomSettings = (): UseCustomSettings => {
    const [scale, setScale] = useState<Ratio | undefined>(undefined);
    const [isMirrored, setIsMirrored] = useState(false);

    const getRatio = (value: RatioType): Ratio | undefined => {
        switch (value) {
            case '5/4':
                return { numerator: 5, denumerator: 4 };
            case '4/3':
                return { numerator: 4, denumerator: 3 };
            case '3/2':
                return { numerator: 3, denumerator: 2 };
            case '16/9':
                return { numerator: 16, denumerator: 9 };
            default:
                return undefined;
        }
    };

    const mirrorOption = {
        name: 'Mirror camera',
        config: {
            type: 'selection',
            options: ['Off', 'On'],
            value: isMirrored ? 'On' : 'Off',
            defaultValue: 'Off',
        } as SettingSelection,
        onChange: (value: number | string) => {
            setIsMirrored(value === 'On');
        },
    };

    const scaleOption = {
        name: 'Scale',
        config: {
            type: 'selection',
            options: ratioTypes as unknown,
            value: ratioTypes[0],
            defaultValue: ratioTypes[0],
        } as SettingSelection,
        onChange: (value: string | number) => {
            const ratio = getRatio(value as RatioType);
            setScale(ratio);
        },
    };

    return {
        scale,
        isMirrored,
        scaleOption,
        mirrorOption,
    };
};
