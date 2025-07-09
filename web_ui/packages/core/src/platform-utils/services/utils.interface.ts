// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Environment, GPUProvider } from '../dto/utils.interface';

export interface ProductInfoEntity {
    isSmtpDefined: boolean;
    productVersion: string;
    buildVersion: string;
    intelEmail: string;
    environment: Environment;
    grafanaEnabled: boolean;
    gpuProvider: GPUProvider;
}

export type WorkflowId = string;

export interface PlatformUtilsService {
    getProductInfo: () => Promise<ProductInfoEntity>;
    checkPlatformBackup: () => Promise<CheckPlatformBackup>;
    getPlatformVersions: () => Promise<PlatformVersion[]>;
    getPlatformUpgradeProgress: () => Promise<PlatformUpgradeProgress>;
    upgradePlatform: (payload: PlatformUpgradePayload) => Promise<void>;
}

export interface CheckPlatformBackup {
    isBackupPossible: boolean;
}

export interface PlatformVersion {
    version: string;
    k3sVersion: string;
    nvidiaDriversVersion: string;
    intelDriversVersion: string;
    isCurrent: boolean;
    isUpgradeRequired: boolean;
}

type PlatformUpgradeProgressStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ROLLING_BACK' | 'NOT_RUNNING';

export interface PlatformUpgradeProgress {
    progress: string;
    status: PlatformUpgradeProgressStatus;
    message: string;
}

export interface PlatformUpgradePayload {
    version: string;
    forceUpgrade?: boolean;
}
