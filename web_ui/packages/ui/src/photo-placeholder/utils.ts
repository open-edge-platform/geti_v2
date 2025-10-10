// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { isEmpty } from 'lodash-es';

type RGBArray = [number, number, number, number];

export const hexaToRGBA = (hex: string): RGBArray => {
    if (isEmpty(hex)) {
        return [0, 0, 0, 0];
    }

    if (hex.length == 9) {
        return [
            Number('0x' + hex[1] + hex[2]),
            Number('0x' + hex[3] + hex[4]),
            Number('0x' + hex[5] + hex[6]),
            Number('0x' + hex[7] + hex[8]),
        ];
    }

    const alpha = Number('0x' + hex[4] + hex[4]);

    return [
        Number('0x' + hex[1] + hex[1]),
        Number('0x' + hex[2] + hex[2]),
        Number('0x' + hex[3] + hex[3]),
        Number.isNaN(alpha) ? 1 : alpha,
    ];
};

/**
 * Determines the appropriate foreground color based on background color
 * source https://css-tricks.com/css-variables-calc-rgb-enforcing-high-contrast-colors/
 */
export const getForegroundColor = (backgroundRgb: RGBArray, lowContrast: string, highContrast: string): string => {
    const [r, g, b] = backgroundRgb;
    const sum = Math.round((r * 299 + g * 587 + b * 114) / 1000);

    return sum > 128 ? lowContrast : highContrast;
};
