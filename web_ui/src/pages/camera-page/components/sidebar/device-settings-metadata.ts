// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { DeviceSettingsMetadata } from './device-settings-config.interface';

export const settingsMetadata: DeviceSettingsMetadata = {
    categories: [
        {
            categoryName: 'Camera color settings',
            attributesKeys: [
                'brightness',
                'contrast',
                'saturation',
                'sharpness',
                'whiteBalanceMode',
                'colorTemperature',
            ],
        },
        {
            categoryName: 'Camera movement settings',
            attributesKeys: ['frameRate'],
        },
        {
            categoryName: 'Dimensions',
            attributesKeys: ['Scale', 'height', 'width', 'resizeMode'],
        },
        {
            categoryName: 'Exposure settings',
            attributesKeys: ['exposureMode', 'exposureTime', 'exposureCompensation'],
        },
        {
            categoryName: 'Other camera settings',
            attributesKeys: ['Mirror camera'],
        },
    ],
    defaultCategory: 'Others',
    dependencies: [
        {
            key: 'exposureMode',
            type: 'selection',
            children: ['exposureTime', 'exposureCompensation'],
        },
        {
            key: 'whiteBalanceMode',
            type: 'selection',
            children: ['colorTemperature'],
        },
    ],
};
