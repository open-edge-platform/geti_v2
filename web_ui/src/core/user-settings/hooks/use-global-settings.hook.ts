// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useApplicationServices } from '@geti/core/src/services/application-services-provider.component';
import { toast } from '@geti/ui';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import QUERY_KEYS from '../../../../packages/core/src/requests/query-keys';
import { UserGlobalSettings, UseSettings } from '../services/user-settings.interface';
import { INITIAL_GLOBAL_SETTINGS } from '../utils';
import { SaveSettingsMutation, SaveSettingsMutationContext, SETTINGS_QUERY_STALE_TIME } from './utils';

const useQueryUserGlobalSettings = () => {
    const { userSettingsService } = useApplicationServices();

    const { data } = useSuspenseQuery<UserGlobalSettings, AxiosError>({
        queryKey: QUERY_KEYS.SETTINGS_KEY(),
        queryFn: () => {
            return userSettingsService.getGlobalSettings();
        },
        retry: false,
        staleTime: SETTINGS_QUERY_STALE_TIME,
    });

    return { data };
};

export const useUserGlobalSettings = (): UseSettings<UserGlobalSettings> => {
    const { userSettingsService } = useApplicationServices();
    const queryClient = useQueryClient();

    const { data } = useQueryUserGlobalSettings();

    const settingsMutation = useMutation<
        void,
        AxiosError,
        SaveSettingsMutation<UserGlobalSettings>,
        SaveSettingsMutationContext<UserGlobalSettings>
    >({
        mutationFn: ({ settings }) => {
            return userSettingsService.saveGlobalSettings(settings);
        },

        onMutate: async ({ settings }) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.SETTINGS_KEY() });

            const previousSettings = queryClient.getQueryData<UserGlobalSettings>(QUERY_KEYS.SETTINGS_KEY());

            queryClient.setQueryData<UserGlobalSettings>(QUERY_KEYS.SETTINGS_KEY(), () => settings);

            return {
                previousSettings,
            };
        },

        onSuccess: async (_data, variables) => {
            const { successMessage } = variables;
            successMessage && toast({ message: successMessage, type: 'info' });
        },

        onError: (_, __, context) => {
            context?.previousSettings !== undefined &&
                queryClient.setQueryData<UserGlobalSettings>(QUERY_KEYS.SETTINGS_KEY(), () => context.previousSettings);

            toast({
                message: 'Failed to save settings. Please, try again later.',
                type: 'info',
            });
        },

        onSettled: async () => {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SETTINGS_KEY() });
        },
    });

    const saveConfig = async (newSettingsConfig: UserGlobalSettings, successMessage?: string) => {
        return settingsMutation.mutateAsync({
            settings: newSettingsConfig,
            successMessage,
        });
    };

    return {
        config: data ?? INITIAL_GLOBAL_SETTINGS,
        saveConfig,
        isSavingConfig: settingsMutation.isPending,
    };
};
