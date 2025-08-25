// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode } from 'react';

import { Flex, Text, type FlexProps } from '@geti/ui';

import classes from './info-section.module.scss';

interface InfoSectionProps extends Omit<FlexProps, 'children'> {
    icon: ReactNode;
    message: string;
}

export const InfoSection = ({ icon, message, ...flexProps }: InfoSectionProps) => {
    return (
        <Flex UNSAFE_className={classes.infoWrapper} data-testid='info-section' {...flexProps}>
            {icon}
            <Text>{message}</Text>
        </Flex>
    );
};
