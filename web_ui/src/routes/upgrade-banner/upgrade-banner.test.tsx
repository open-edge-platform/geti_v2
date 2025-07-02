// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { createInMemoryPlatformUtilsService } from '@geti/core/src/platform-utils/services/create-in-memory-platform-utils-service';
import { screen, waitForElementToBeRemoved } from '@testing-library/react';

import { createInMemoryUserSettingsService } from '../../core/user-settings/services/in-memory-user-settings-service';
import { getMockedPlatformVersion } from '../../test-utils/mocked-items-factory/mocked-platform-utils';
import { getMockedUserGlobalSettings } from '../../test-utils/mocked-items-factory/mocked-settings';
import { providersRender as render } from '../../test-utils/required-providers-render';
import { UpgradeBanner } from './upgrade-banner.component';

describe('UpgradeBanner', () => {
    it('does not display banner when feature flag is not enabled', () => {
        render(<UpgradeBanner />, {
            featureFlags: {
                FEATURE_FLAG_PLATFORM_UPGRADE: false,
            },
        });

        expect(screen.queryByRole('heading', { name: /a new version is available!/i })).not.toBeInTheDocument();
    });

    it('displays banner when feature flag is enabled, current version is different than latest version, and banner was not dismissed for the latest version', async () => {
        const platformUtilsService = createInMemoryPlatformUtilsService();
        const userSettingsService = createInMemoryUserSettingsService();
        const currentVersion = getMockedPlatformVersion({ version: '2.11.0', isCurrent: true });

        userSettingsService.getGlobalSettings = jest.fn(async () =>
            getMockedUserGlobalSettings({
                upgradeBanner: {
                    dismissedVersion: currentVersion.version,
                },
            })
        );

        platformUtilsService.getPlatformVersions = jest.fn(async () => [
            getMockedPlatformVersion({ version: '2.12.0', isCurrent: false }),
            currentVersion,
        ]);

        render(<UpgradeBanner />, {
            featureFlags: {
                FEATURE_FLAG_PLATFORM_UPGRADE: true,
            },
            services: {
                platformUtilsService,
                userSettingsService,
            },
        });

        await waitForElementToBeRemoved(screen.getByRole('progressbar'));

        expect(screen.getByRole('heading', { name: /a new version is available!/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Upgrade' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    });

    it('does not display banner when feature flag is enabled, current version is different than latest version, but banner was dismissed for the latest version', async () => {
        const platformUtilsService = createInMemoryPlatformUtilsService();
        const userSettingsService = createInMemoryUserSettingsService();
        const latestVersion = getMockedPlatformVersion({ version: '2.12.0', isCurrent: false });

        userSettingsService.getGlobalSettings = jest.fn(async () =>
            getMockedUserGlobalSettings({
                upgradeBanner: {
                    dismissedVersion: latestVersion.version,
                },
            })
        );

        platformUtilsService.getPlatformVersions = jest.fn(async () => [
            latestVersion,
            getMockedPlatformVersion({ version: '2.11.0', isCurrent: true }),
        ]);

        render(<UpgradeBanner />, {
            featureFlags: {
                FEATURE_FLAG_PLATFORM_UPGRADE: true,
            },
            services: {
                platformUtilsService,
                userSettingsService,
            },
        });

        await waitForElementToBeRemoved(screen.getByRole('progressbar'));

        expect(screen.queryByRole('heading', { name: /a new version is available!/i })).not.toBeInTheDocument();
    });

    it('does not display banner when feature flag is enabled, current version is the same as latest version', async () => {
        const platformUtilsService = createInMemoryPlatformUtilsService();
        const userSettingsService = createInMemoryUserSettingsService();

        userSettingsService.getGlobalSettings = jest.fn(async () =>
            getMockedUserGlobalSettings({
                upgradeBanner: {
                    dismissedVersion: null,
                },
            })
        );

        platformUtilsService.getPlatformVersions = jest.fn(async () => [
            getMockedPlatformVersion({ version: '2.12.0', isCurrent: true }),
        ]);

        render(<UpgradeBanner />, {
            featureFlags: {
                FEATURE_FLAG_PLATFORM_UPGRADE: true,
            },
            services: {
                platformUtilsService,
                userSettingsService,
            },
        });

        await waitForElementToBeRemoved(screen.getByRole('progressbar'));

        expect(screen.queryByRole('heading', { name: /a new version is available!/i })).not.toBeInTheDocument();
    });
});
