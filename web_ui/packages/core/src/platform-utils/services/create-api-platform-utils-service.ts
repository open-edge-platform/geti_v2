// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { apiClient } from '../../client/axios-instance';
import { CreateApiService } from '../../services/create-api-service.interface';
import { API_URLS } from '../../services/urls';
import { CheckBackupDTO, Environment, ProductInfoEntityDTO } from '../dto/utils.interface';
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

    const checkBackup: PlatformUtilsService['checkBackup'] = async () => {
        const { data } = await instance.get<CheckBackupDTO>(router.PLATFORM.CHECK_BACKUP);

        return {
            isBackupPossible: data.is_backup_possible,
        };
    };

    return {
        getProductInfo,
        checkBackup,
    };
};
