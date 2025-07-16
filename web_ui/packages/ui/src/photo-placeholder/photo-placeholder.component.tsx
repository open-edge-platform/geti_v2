// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC } from 'react';

import { Flex, Text, View, ViewProps } from '@adobe/react-spectrum';
import { StyleProps } from '@react-types/shared';
import { isEmpty } from 'lodash-es';

import { getDistinctColorBasedOnHash, getForegroundColor, hexaToRGBA } from './utils';

export interface PhotoPlaceholderProps extends StyleProps {
    name: string;
    email: string;
    width?: ViewProps<5>['width'];
    height?: ViewProps<5>['height'];
    borderRadius?: string;
}

export const PhotoPlaceholder: FC<PhotoPlaceholderProps> = ({
    name,
    email,
    width = 'size-1600',
    height = 'size-1600',
    borderRadius = '50%',
    ...viewProps
}) => {
    const backgroundColor = getDistinctColorBasedOnHash(email);
    const letter = (isEmpty(name.trim()) ? email : name).charAt(0);

    const color = getForegroundColor(
        hexaToRGBA(backgroundColor),
        'var(--spectrum-global-color-gray-50)',
        'var(--spectrum-global-color-gray-900)'
    );

    return (
        <View
            width={width}
            minWidth={width}
            minHeight={height}
            height={height}
            UNSAFE_style={{ backgroundColor, color, borderRadius }}
            data-testid={'placeholder-avatar-id'}
            {...viewProps}
        >
            <Flex height={'100%'} width={'100%'} alignItems={'center'} justifyContent={'center'}>
                <Text data-testid={'placeholder-letter-id'}>{letter.toUpperCase()}</Text>
            </Flex>
        </View>
    );
};
