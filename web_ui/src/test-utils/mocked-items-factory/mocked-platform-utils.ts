// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Environment, GPUProvider } from '@geti/core/src/platform-utils/dto/utils.interface';
import {
    PlatformUpgradeProgress,
    PlatformVersion,
    ProductInfoEntity,
} from '@geti/core/src/platform-utils/services/utils.interface';

export const getMockedProductInfo = (productInfo: Partial<ProductInfoEntity> = {}): ProductInfoEntity => ({
    productVersion: '1.6.0',
    buildVersion: '1.6.0.test.123123',
    isSmtpDefined: true,
    grafanaEnabled: false,
    gpuProvider: GPUProvider.INTEL,
    intelEmail: 'support@geti.com',
    environment: Environment.ON_PREM,
    ...productInfo,
});

export const getMockedPlatformVersion = (entity: Partial<PlatformVersion> = {}): PlatformVersion => {
    return {
        version: '2.11.0',
        k3sVersion: 'v1.26.6+k3s1',
        nvidiaDriversVersion: '525.105.17',
        intelDriversVersion: '1.6.0',
        isCurrent: true,
        isUpgradeRequired: false,
        ...entity,
    };
};

export const getMockedPlatformUpgradeProgress = (
    progress: Partial<PlatformUpgradeProgress> = {}
): PlatformUpgradeProgress => {
    return {
        progress: '100%',
        status: 'SUCCEEDED',
        message: 'Upgrade completed successfully',
        ...progress,
    };
};
