// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

export enum Environment {
    SAAS = 'saas',
    ON_PREM = 'on-prem',
}

export enum GPUProvider {
    NONE = 'none',
    INTEL = 'intel',
    NVIDIA = 'nvidia',
}

export interface ProductInfoEntityDTO {
    'intel-email': string;
    'product-version': string;
    'build-version': string;
    'smtp-defined': string;
    'gpu-provider': GPUProvider;
    grafana_enabled: boolean;
    environment?: Environment;
}

export interface CheckBackupDTO {
    is_backup_possible: boolean;
}

export interface PlatformVersionsDTO {
    versions: {
        version: string;
        k3s_version: string;
        nvidia_drivers_version: string;
        intel_drivers_version: string;
        is_current: boolean;
        is_upgrade_required: boolean;
    }[];
}

type PlatformUpgradeProgressStatusDTO = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ROLLING_BACK' | 'NOT_RUNNING';

export interface PlatformUpgradeProgressDTO {
    progress: string;
    status: PlatformUpgradeProgressStatusDTO;
    message: string;
}

export interface PlatformUpgradePayloadDTO {
    version_number: string;
    force_upgrade?: boolean;
}
