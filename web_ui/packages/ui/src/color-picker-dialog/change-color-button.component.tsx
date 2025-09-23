// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ActionButton, View, type BorderRadiusValue, type Responsive } from '../..';

interface ChangeColorButtonProps {
    size: 'S' | 'M' | 'L';
    id: string;
    color: string | undefined;
    ariaLabelPrefix?: string;
    gridArea?: string;
}

export const ChangeColorButton = ({ size, ariaLabelPrefix, id, color, gridArea }: ChangeColorButtonProps) => {
    const sizeParameters: { size: string; radius?: Responsive<BorderRadiusValue>; margin: string } =
        size === 'L'
            ? { size: 'size-400', radius: 'small', margin: 'size-100' }
            : size === 'M'
              ? { size: 'size-200', margin: 'size-75' }
              : { size: 'size-125', margin: 'size-125' };

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
