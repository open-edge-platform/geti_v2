// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { View } from '@adobe/react-spectrum';
import { BorderRadiusValue, Responsive } from '@react-types/shared';

import { ActionButton } from '../button/button.component';

interface ChangeColorButtonProps {
    size: 'S' | 'M' | 'L';
    id: string;
    color: string | undefined;
    ariaLabelPrefix?: string;
    gridArea?: string;
}

export const ChangeColorButton = ({ size, ariaLabelPrefix, id, color, gridArea }: ChangeColorButtonProps) => {
    const CHANGE_COLOR_BUTTON_SIZE = {
        S: {
            size: 'size-125',
            margin: 'size-125',
        },
        M: {
            size: 'size-200',
            margin: 'size-75',
        },
        L: {
            size: 'size-400',
            margin: 'size-100',
            radius: 'small',
        },
    } as const;

    const sizeParameters: { size: string; radius?: Responsive<BorderRadiusValue>; margin: string } =
        CHANGE_COLOR_BUTTON_SIZE[size];

    return (
        <ActionButton
            id={id}
            data-testid={`${id}-button`}
            height={'fit-content'}
            isQuiet={false}
            aria-label={`${ariaLabelPrefix ? ariaLabelPrefix + ' ' : ''}Color picker button`}
            gridArea={gridArea}
        >
            <View
                width={sizeParameters.size}
                height={sizeParameters.size}
                minWidth={sizeParameters.size}
                borderRadius={sizeParameters.radius || undefined}
                margin={sizeParameters.margin}
                id={`${id}-selected-color`}
                UNSAFE_style={{ backgroundColor: color }}
            />
        </ActionButton>
    );
};
