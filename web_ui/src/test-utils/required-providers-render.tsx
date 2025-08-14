// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactElement, ReactNode, Suspense, useMemo } from 'react';

import { CustomFeatureFlags, DEV_FEATURE_FLAGS } from '@geti/core';
import QUERY_KEYS from '@geti/core/src/requests/query-keys';
import {
    ApplicationServicesContextProps,
    ApplicationServicesProvider,
} from '@geti/core/src/services/application-services-provider.component';
import { OnboardingProfile } from '@geti/core/src/users/services/onboarding-service.interface';
import { defaultTheme, IntelBrandedLoading, Provider as ThemeProvider } from '@geti/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { AuthProvider } from 'react-oidc-context';
import { MemoryRouter as Router } from 'react-router-dom';

import { AccountStatusDTO } from '../core/organizations/dtos/organizations.interface';
import { NotificationProvider, Notifications, useNotification } from '../notification/notification.component';
import { createGetiQueryClient } from '../providers/query-client-provider/query-client-provider.component';
import { TusUploadProvider } from '../providers/tus-upload-provider/tus-upload-provider.component';
import { getMockedWorkspace } from './mocked-items-factory/mocked-workspace';

interface RequiredProvidersProps extends Partial<ApplicationServicesContextProps> {
    children?: ReactNode;
    initialEntries?: string[];
    featureFlags?: CustomFeatureFlags;
    profile?: OnboardingProfile | null;
}

const prefilledOrgId = '000000000000000000000001';

const PrefilledQueryClientProvider = ({
    children,
    featureFlags,
    profile,
}: {
    children: ReactNode;
    featureFlags?: CustomFeatureFlags;
    profile?: OnboardingProfile | null;
}) => {
    const { addNotification } = useNotification();

    const prefilledQueryClient = useMemo(() => {
        const client = createGetiQueryClient({
            addNotification,
            defaultQueryOptions: {
                queries: {
                    gcTime: 1000,
                },
            },
        });

        client.setQueryData(QUERY_KEYS.FEATURE_FLAGS, {
            ...DEV_FEATURE_FLAGS,
            ...featureFlags,
        });

        if (profile !== null) {
            client.setQueryData(QUERY_KEYS.USER_ONBOARDING_PROFILE, {
                organizations: [{ id: prefilledOrgId, status: AccountStatusDTO.ACTIVE }],
                hasAcceptedUserTermsAndConditions: true,
                ...profile,
            });
        }

        ['123', 'org-id', 'organization-id', prefilledOrgId].forEach((organizationId) => {
            const workspaceKey = QUERY_KEYS.WORKSPACES(organizationId);

            client.setQueryData(workspaceKey, [
                getMockedWorkspace({ id: 'workspace-1', name: 'Workspace 1' }),
                getMockedWorkspace({ id: 'workspace-2', name: 'Workspace 2' }),
            ]);
        });

        return client;
    }, [addNotification, featureFlags, profile]);

    return <QueryClientProvider client={prefilledQueryClient}>{children}</QueryClientProvider>;
};

export const RequiredProviders = ({
    children,
    featureFlags,
    initialEntries,
    profile,
    ...services
}: RequiredProvidersProps): JSX.Element => {
    return (
        <Suspense fallback={<IntelBrandedLoading />}>
            <Router initialEntries={initialEntries}>
                <NotificationProvider>
                    <Notifications />
                    <PrefilledQueryClientProvider featureFlags={featureFlags} profile={profile}>
                        <ThemeProvider theme={defaultTheme}>
                            <Suspense fallback={<IntelBrandedLoading />}>
                                <ApplicationServicesProvider useInMemoryEnvironment {...services}>
                                    <AuthProvider>
                                        <TusUploadProvider>{children}</TusUploadProvider>
                                    </AuthProvider>
                                </ApplicationServicesProvider>
                            </Suspense>
                        </ThemeProvider>
                    </PrefilledQueryClientProvider>
                </NotificationProvider>
            </Router>
        </Suspense>
    );
};

export interface CustomRenderOptions extends RenderOptions {
    services?: Partial<ApplicationServicesContextProps>;
    featureFlags?: CustomFeatureFlags;
    profile?: OnboardingProfile | null;
    initialEntries?: string[];
}

const customRender = (ui: ReactElement, options?: CustomRenderOptions): RenderResult => {
    const services = options?.services;
    const initialEntries = options?.initialEntries;
    const featureFlags = options?.featureFlags;
    const profile = options?.profile;

    const Wrapper = (props: RequiredProvidersProps) => {
        return (
            <RequiredProviders
                {...props}
                featureFlags={featureFlags}
                profile={profile}
                {...services}
                initialEntries={initialEntries}
            />
        );
    };

    return render(ui, { wrapper: Wrapper, ...options });
};

export { customRender as providersRender };
