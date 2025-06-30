// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { apiClient } from '../../client/axios-instance';
import { CreateApiService } from '../../services/create-api-service.interface';
import { API_URLS } from '../../services/urls';
import {
    CheckBackupDTO,
    Environment,
    PlatformUpgradePayloadDTO,
    PlatformUpgradeProgressDTO,
    PlatformVersionsDTO,
    ProductInfoEntityDTO,
} from '../dto/utils.interface';
import { PlatformUtilsService } from './utils.interface';

const isSmtpDefined = (val: string) => val === 'True';

export const createApiPlatformUtilsService: CreateApiService<PlatformUtilsService> = (
    { instance, router } = { instance: apiClient, router: API_URLS }
) => {
    const getProductInfo: PlatformUtilsService['getProductInfo'] = async () => {
        const { data } = await instance.get<ProductInfoEntityDTO>(router.PLATFORM.PRODUCT_INFO);

        return {
            intelEmail: data['intel-email'],
            productVersion: data['product-version'],
            buildVersion: data['build-version'],
            isSmtpDefined: isSmtpDefined(data['smtp-defined']),
            environment: data?.environment || Environment.ON_PREM,
            grafanaEnabled: data?.grafana_enabled,
            gpuProvider: data['gpu-provider'],
        };
    };

    const checkPlatformBackup: PlatformUtilsService['checkPlatformBackup'] = async () => {
        const { data } = await instance.get<CheckBackupDTO>(router.PLATFORM.CHECK_BACKUP);

        return {
            isBackupPossible: data.is_backup_possible,
        };
    };

    const getPlatformVersions: PlatformUtilsService['getPlatformVersions'] = async () => {
        const { data } = await instance.get<PlatformVersionsDTO>(router.PLATFORM.VERSIONS);

        return data.versions.map(
            ({
                version,
                k3s_version,
                nvidia_drivers_version,
                intel_drivers_version,
                is_upgrade_required,
                is_current,
            }) => ({
                version,
                k3sVersion: k3s_version,
                nvidiaDriversVersion: nvidia_drivers_version,
                intelDriversVersion: intel_drivers_version,
                isCurrent: is_current,
                isUpgradeRequired: is_upgrade_required,
            })
        );
    };

    const getPlatformUpgradeProgress: PlatformUtilsService['getPlatformUpgradeProgress'] = async () => {
        const { data } = await instance.get<PlatformUpgradeProgressDTO>(router.PLATFORM.UPGRADE_PROGRESS);

        return {
            progress: data.progress,
            status: data.status,
            message: data.message,
        };
    };

    const upgradePlatform: PlatformUtilsService['upgradePlatform'] = async ({ version, forceUpgrade }) => {
        const payloadDTO: PlatformUpgradePayloadDTO = {
            version_number: version,
            force_upgrade: forceUpgrade,
        };

        await instance.post(router.PLATFORM.UPGRADE, payloadDTO);
    };

    return {
        getProductInfo,
        checkPlatformBackup,
        getPlatformVersions,
        getPlatformUpgradeProgress,
        upgradePlatform,
    };
};
