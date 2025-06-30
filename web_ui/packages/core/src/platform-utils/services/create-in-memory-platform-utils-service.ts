// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import {
    getMockedPlatformUpgradeProgress,
    getMockedPlatformVersion,
} from '../../../../../src/test-utils/mocked-items-factory/mocked-platform-utils';
import { Environment, GPUProvider } from '../dto/utils.interface';
import { PlatformUtilsService } from './utils.interface';

export const createInMemoryPlatformUtilsService = (): PlatformUtilsService => {
    const getProductInfo: PlatformUtilsService['getProductInfo'] = async () => {
        return {
            productVersion: '1.6.0',
            grafanaEnabled: false,
            gpuProvider: GPUProvider.INTEL,
            buildVersion: '1.6.0.test.123123',
            isSmtpDefined: true,
            intelEmail: 'support@geti.com',
            environment: Environment.ON_PREM,
        };
    };

    const checkPlatformBackup: PlatformUtilsService['checkPlatformBackup'] = () => {
        return Promise.resolve({
            isBackupPossible: true,
        });
    };

    const getPlatformVersions: PlatformUtilsService['getPlatformVersions'] = async () => {
        return [getMockedPlatformVersion()];
    };

    const getPlatformUpgradeProgress: PlatformUtilsService['getPlatformUpgradeProgress'] = async () => {
        return getMockedPlatformUpgradeProgress();
    };

    const upgradePlatform = async () => {
        await Promise.resolve();
    };

    return {
        getProductInfo,
        checkPlatformBackup,
        getPlatformVersions,
        getPlatformUpgradeProgress,
        upgradePlatform,
    };
};
