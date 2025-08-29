// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode } from 'react';

import { View } from '@adobe/react-spectrum';

interface CornerIndicatorProps {
    isActive: boolean;
    children: ReactNode;
}

export const CornerIndicator = ({ isActive, children }: CornerIndicatorProps) => {
    return (
        <View position='relative'>
            <View
                position='absolute'
                top='size-50'
                right='size-50'
                width='size-50'
                height='size-50'
                borderRadius='large'
                backgroundColor='blue-700'
                isHidden={!isActive}
            />
            {children}
        </View>
    );
};
