// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect } from 'react';

import { dimensionValue, Flex, Heading, Text, toast } from '@geti/ui';

export const PermissionError = (): JSX.Element => {
    useEffect(() => {
        toast({
            message: 'Please check your device and network settings and try again.',
            type: 'warning',
            title: 'Camera connection is lost',
        });
    }, []);

    return (
        <Flex
            gridArea={'content'}
            UNSAFE_style={{ background: 'var(--spectrum-global-color-gray-50)' }}
            height={'100%'}
        >
            <Flex margin={'size-250'} flexGrow={1} direction={'column'} alignItems={'center'} justifyContent={'center'}>
                <Heading level={2} margin={0} UNSAFE_style={{ fontSize: dimensionValue('size-450') }}>
                    Camera connection is lost
                </Heading>
                <Text>Please check your device and network settings and try again.</Text>
            </Flex>
        </Flex>
    );
};
