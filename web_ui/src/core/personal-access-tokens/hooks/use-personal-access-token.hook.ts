// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useApplicationServices } from '@geti/core/src/services/application-services-provider.component';
import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import QUERY_KEYS from '../../../../packages/core/src/requests/query-keys';
import {
    BaseTokenProps,
    CreatePersonalAccessTokenPayload,
    DeletePersonalAccessTokenPayload,
    PartialPersonalAccessToken,
    PersonalAccessToken,
    PersonalAccessTokens,
    UpdatePersonalAccessTokenPayload,
    UsePersonalAccessToken,
} from '../personal-access-tokens.interface';

export const usePersonalAccessToken = (): UsePersonalAccessToken => {
    const queryClient = useQueryClient();
    const { personalAccessTokensService } = useApplicationServices();

    const createPersonalAccessTokenMutation = useMutation<
        PersonalAccessToken,
        AxiosError,
        CreatePersonalAccessTokenPayload
    >({
        mutationFn: (props: CreatePersonalAccessTokenPayload) =>
            personalAccessTokensService.createPersonalAccessToken(props),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SERVICE_ACCOUNTS_API_KEY });
        },
    });

    const deletePersonalAccessTokenMutation = useMutation<void, AxiosError, DeletePersonalAccessTokenPayload>({
        mutationFn: (props: DeletePersonalAccessTokenPayload) =>
            personalAccessTokensService.deletePersonalAccessToken(props),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SERVICE_ACCOUNTS_API_KEY });
        },
    });

    const updatePersonalAccessTokenMutation = useMutation<
        PartialPersonalAccessToken,
        AxiosError,
        UpdatePersonalAccessTokenPayload
    >({
        mutationFn: (props: UpdatePersonalAccessTokenPayload) =>
            personalAccessTokensService.updatePersonalAccessToken(props),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SERVICE_ACCOUNTS_API_KEY });
        },
    });

    const useGetPersonalAccessTokensQuery = (props: BaseTokenProps): UseQueryResult<PersonalAccessTokens, AxiosError> =>
        useQuery<PersonalAccessTokens, AxiosError>({
            queryKey: QUERY_KEYS.SERVICE_ACCOUNTS_API_KEY,
            queryFn: async () => await personalAccessTokensService.getPersonalAccessTokens(props),
            retry: 1,
        });

    return {
        createPersonalAccessTokenMutation,
        useGetPersonalAccessTokensQuery,
        deletePersonalAccessTokenMutation,
        updatePersonalAccessTokenMutation,
    };
};
