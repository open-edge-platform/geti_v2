// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useAuth } from 'react-oidc-context';
import { v4 as uuid } from 'uuid';

import { useFeatureFlags } from '../../feature-flags/hooks/use-feature-flags.hook';
import QUERY_KEYS from '../../requests/query-keys';
import { useApplicationServices } from '../../services/application-services-provider.component';
import {
    CheckPlatformBackup,
    PlatformUpgradePayload,
    PlatformUpgradeProgress,
    PlatformVersion,
    ProductInfoEntity,
    WorkflowId,
} from '../services/utils.interface';

const placeholderUuid = uuid();

export const useProductInfo = (): UseQueryResult<ProductInfoEntity, AxiosError> => {
    const { platformUtilsService } = useApplicationServices();

    return useQuery<ProductInfoEntity, AxiosError>({
        queryKey: QUERY_KEYS.PLATFORM_UTILS_KEYS.VERSION_ENTITY_KEY,
        queryFn: platformUtilsService.getProductInfo,
        meta: { notifyOnError: true },
    });
};

export const useWorkflowId = (): UseQueryResult<WorkflowId, AxiosError> => {
    const { FEATURE_FLAG_ANALYTICS_WORKFLOW_ID = false } = useFeatureFlags();
    const auth = useAuth();

    return useQuery<WorkflowId, AxiosError>({
        queryKey: QUERY_KEYS.PLATFORM_UTILS_KEYS.WORKFLOW_ID(auth.user?.profile.sub || placeholderUuid),
        queryFn: async () => {
            if (auth && auth.user) {
                return auth.user.profile.sub;
            }

            return placeholderUuid;
        },
        retry: false,
        enabled: FEATURE_FLAG_ANALYTICS_WORKFLOW_ID,
        placeholderData: placeholderUuid,
    });
};

export const useCheckPlatformBackupQuery = (): UseQueryResult<CheckPlatformBackup> => {
    const { platformUtilsService } = useApplicationServices();

    return useQuery({
        queryKey: QUERY_KEYS.PLATFORM_UTILS_KEYS.CHECK_BACKUP,
        queryFn: () => {
            return platformUtilsService.checkPlatformBackup();
        },
    });
};

export const usePlatformVersionsQuery = (): UseQueryResult<PlatformVersion[]> => {
    const { platformUtilsService } = useApplicationServices();

    return useQuery({
        queryKey: QUERY_KEYS.PLATFORM_UTILS_KEYS.PLATFORM_VERSIONS,
        queryFn: () => {
            return platformUtilsService.getPlatformVersions();
        },
    });
};

export const usePlatformUpgradeProgressQuery = (): UseQueryResult<PlatformUpgradeProgress> => {
    const { platformUtilsService } = useApplicationServices();

    return useQuery({
        queryKey: QUERY_KEYS.PLATFORM_UTILS_KEYS.UPGRADE_PROGRESS,
        queryFn: () => {
            return platformUtilsService.getPlatformUpgradeProgress();
        },
    });
};

export const usePlatformUpgradeMutation = () => {
    const { platformUtilsService } = useApplicationServices();

    return useMutation<void, AxiosError, PlatformUpgradePayload>({
        mutationFn: platformUtilsService.upgradePlatform,
    });
};
