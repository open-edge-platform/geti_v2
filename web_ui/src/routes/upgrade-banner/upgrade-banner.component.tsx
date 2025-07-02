// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useFeatureFlags } from '@geti/core/src/feature-flags/hooks/use-feature-flags.hook';
import { usePlatformVersionsQuery } from '@geti/core/src/platform-utils/hooks/use-platform-utils.hook';
import { Button, Flex, Heading, Text, View } from '@geti/ui';
import { orderBy } from 'lodash-es';

import { GENERAL_SETTINGS_KEYS } from '../../core/user-settings/dtos/user-settings.interface';
import { useUserGlobalSettings } from '../../core/user-settings/hooks/use-global-settings.hook';
import { getSettingsOfType } from '../../core/user-settings/utils';
import { HasPermission } from '../../shared/components/has-permission/has-permission.component';
import { OPERATION } from '../../shared/components/has-permission/has-permission.interface';

import styles from './upgrade-banner.module.scss';

const useUpgradeBanner = () => {
    const { data: versions } = usePlatformVersionsQuery();

    const currentVersion = versions?.find((version) => version.isCurrent);
    const latestVersion = orderBy(versions, 'version', 'desc')?.at(0);

    const isNewVersionAvailable = currentVersion?.version !== latestVersion?.version;

    return {
        isNewVersionAvailable,
        versions,
        currentVersion,
        latestVersion,
    };
};

const UpgradeBannerContent = () => {
    const { isNewVersionAvailable, latestVersion } = useUpgradeBanner();
    const { saveConfig, config } = useUserGlobalSettings();
    const upgradeBannerConfig = getSettingsOfType(config, GENERAL_SETTINGS_KEYS);

    const shouldShowUpgradeBanner =
        isNewVersionAvailable &&
        upgradeBannerConfig[GENERAL_SETTINGS_KEYS.UPGRADE_BANNER]?.dismissedVersion !== latestVersion?.version;

    if (!shouldShowUpgradeBanner) {
        return null;
    }

    const handleDismissBanner = async () => {
        if (latestVersion === undefined) {
            return;
        }

        await saveConfig({
            ...config,
            [GENERAL_SETTINGS_KEYS.UPGRADE_BANNER]: {
                dismissedVersion: latestVersion?.version,
            },
        });
    };

    return (
        <View padding={'size-250'} UNSAFE_className={styles.container} position={'relative'}>
            <Heading margin={0}>🚀 A new version is available!</Heading>
            <Flex alignItems={'center'} justifyContent={'space-between'}>
                <Text>
                    A new{' '}
                    {latestVersion?.version !== undefined && (
                        <Text UNSAFE_className={styles.version}>{latestVersion.version}</Text>
                    )}{' '}
                    version of the app is ready with fresh features and improvements. Upgrade now to get the best
                    experience.{' '}
                </Text>
                <Flex gap={'size-100'}>
                    <Button variant={'primary'} UNSAFE_className={styles.button}>
                        Upgrade
                    </Button>
                    {!latestVersion?.isUpgradeRequired && (
                        <Button variant={'primary'} UNSAFE_className={styles.closeButton} onPress={handleDismissBanner}>
                            Dismiss
                        </Button>
                    )}
                </Flex>
            </Flex>
        </View>
    );
};

export const UpgradeBanner = () => {
    const { FEATURE_FLAG_PLATFORM_UPGRADE } = useFeatureFlags();

    if (!FEATURE_FLAG_PLATFORM_UPGRADE) {
        return null;
    }

    return (
        <HasPermission operations={[OPERATION.PLATFORM_UPGRADE]}>
            <UpgradeBannerContent />
        </HasPermission>
    );
};
