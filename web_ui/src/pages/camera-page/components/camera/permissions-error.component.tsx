// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { dimensionValue, Flex, Heading, Text } from '@geti/ui';

export const PermissionError = (): JSX.Element => {
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
