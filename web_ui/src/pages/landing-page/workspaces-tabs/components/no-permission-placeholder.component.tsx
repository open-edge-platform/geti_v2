// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Flex, Heading, Text, View } from '@geti/ui';

import { Forbidden } from '../../../../assets/images';
import { CustomWell } from '../../../../shared/components/custom-well/custom-well.component';

export const NoPermissionPlaceholder = () => {
    return (
        <Flex width={'100%'} height={'100%'} flex={'1'}>
            <CustomWell
                height={'100%'}
                minHeight={'size-3400'}
                margin={0}
                id='no-permission-area'
                role='region'
                aria-label='No permission to view workspace'
                isSelectable={false}
                flex={'1'}
            >
                <Flex height={'100%'} alignItems={'center'} justifyContent={'center'} width={'100%'}>
                    <Flex direction={'column'} alignItems={'center'} gap={'size-150'}>
                        <View aria-hidden={true}>
                            <Forbidden />
                        </View>
                        <Heading level={3} margin={0}>
                            Access denied
                        </Heading>
                        <Text>You don’t have permission to view this workspace.</Text>
                    </Flex>
                </Flex>
            </CustomWell>
        </Flex>
    );
};
