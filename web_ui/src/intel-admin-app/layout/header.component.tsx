// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { dimensionValue, Flex, Heading, Header as SpectrumHeader } from '@geti/ui';

import { Navbar } from './navbar.component';

import classes from './layout.module.scss';

export const Header = () => {
    return (
        <SpectrumHeader UNSAFE_className={classes.header}>
            <Flex height={'100%'} alignItems={'center'} gap={'size-700'} marginX={'size-200'}>
                <Flex alignItems={'center'} gap={'size-300'}>
                    <Heading margin={0} UNSAFE_style={{ fontSize: dimensionValue('size-250'), fontWeight: 'normal' }}>
                        Geti™ Admin
                    </Heading>
                </Flex>
                <Navbar />
            </Flex>
        </SpectrumHeader>
    );
};
