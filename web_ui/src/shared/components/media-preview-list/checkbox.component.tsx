// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ComponentProps } from 'react';

import { Checkbox, Flex, View } from '@geti/ui';

interface SelectionCheckboxProps extends ComponentProps<typeof View> {
    isSelected: boolean;
    onToggle: (isSelected: boolean) => void;
}

export const SelectionCheckbox = ({ isSelected, onToggle, ...stylingProps }: SelectionCheckboxProps) => {
    return (
        <View width='size-400' height='size-400' {...stylingProps}>
            <Flex position='relative' justifyContent='center' alignItems='center' width='100%' height='100%'>
                <View
                    width={'100%'}
                    height={'100%'}
                    position={'absolute'}
                    borderRadius={'regular'}
                    backgroundColor={'gray-50'}
                />
                <Checkbox
                    aria-label={'Select media item'}
                    isSelected={isSelected}
                    onChange={onToggle}
                    UNSAFE_style={{ padding: 8 }}
                />
            </Flex>
        </View>
    );
};
