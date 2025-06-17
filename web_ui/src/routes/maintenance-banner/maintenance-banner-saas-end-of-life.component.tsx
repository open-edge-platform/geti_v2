// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useState } from 'react';

import { ActionButton, Content, Flex, Heading, View } from '@geti/ui';
import { Alert, Close } from '@geti/ui/icons';

import { useIsSaasEnv } from '../../hooks/use-is-saas-env/use-is-saas-env.hook';

import classes from './maintenance-banner.module.scss';

export const MaintenanceBannerSaaSEndOfLife = () => {
    const isSaasEnv = useIsSaasEnv();
    const [isBannerVisible, setIsBannerVisible] = useState(true);

    const handleDismissBanner = () => {
        setIsBannerVisible(false);
    };

    if (!isBannerVisible || !isSaasEnv) {
        return null;
    }

    return (
        <View UNSAFE_className={classes.banner} id={'maintenance-banner-id'}>
            <Flex alignItems={'center'} justifyContent={'space-between'} marginBottom={'size-200'}>
                <Heading level={2} UNSAFE_className={classes.heading}>
                    <Flex alignItems={'center'}>
                        <Alert className={classes.alertIcon} />
                        Important update to Geti Cloud Trial
                    </Flex>
                </Heading>
                <ActionButton
                    isQuiet
                    onPress={handleDismissBanner}
                    aria-label='dismiss banner'
                    UNSAFE_className={classes.closeButton}
                    id={'dismiss-maintenance-banner-id'}
                >
                    <Close />
                </ActionButton>
            </Flex>
            <Content UNSAFE_className={classes.content} id={'maintenance-banner-content-id'}>
                We are phasing out our cloud-based services and will exclusively offer on-premises solutions moving
                forward. Please prepare to migrate your data and applications to ensure continued service. Our support
                team is ready to assist you during this transition. Stay tuned for detailed instructions and timelines.
            </Content>
        </View>
    );
};
