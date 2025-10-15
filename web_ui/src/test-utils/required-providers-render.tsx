// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactElement, ReactNode, Suspense } from 'react';

import { CustomFeatureFlags, DEV_FEATURE_FLAGS } from '@geti/core';
import QUERY_KEYS from '@geti/core/src/requests/query-keys';
import {
    ApplicationServicesContextProps,
    ApplicationServicesProvider,
} from '@geti/core/src/services/application-services-provider.component';
import { DeploymentConfiguration } from '@geti/core/src/services/use-deployment-config-query.hook';
import { OnboardingProfile } from '@geti/core/src/users/services/onboarding-service.interface';
import { defaultTheme, IntelBrandedLoading, Provider as ThemeProvider, Toast } from '@geti/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { AuthProvider } from 'react-oidc-context';
import { MemoryRouter as Router } from 'react-router-dom';

import { AccountStatusDTO } from '../core/organizations/dtos/organizations.interface';
import { TusUploadProvider } from '../providers/tus-upload-provider/tus-upload-provider.component';
import { getMockedWorkspace } from './mocked-items-factory/mocked-workspace';

interface RequiredProvidersProps extends Partial<ApplicationServicesContextProps> {
    children?: ReactNode;
    initialEntries?: string[];
    featureFlags?: CustomFeatureFlags;
    profile?: OnboardingProfile | null;
    queryClient?: QueryClient;
    skipPrefillDeploymentConfig?: boolean;
}

const prefilledOrgId = '000000000000000000000001';

const defaultDeploymentConfig: DeploymentConfiguration = {
    servingMode: 'on-prem',
    auth: {
        type: 'dex',
        clientId: 'web_ui',
        authority: '/dex',
    },
    docsUrl: 'https://docs.geti.intel.com/',
    controlPlaneUrl: null,
    dataPlaneUrl: null,
    configUrl: null,
};

const adminDeploymentConfig: DeploymentConfiguration = {
    ...defaultDeploymentConfig,
    servingMode: 'saas',
    auth: {
        type: 'admin',
        clientId: 'intel-admin',
        authority: 'https://accounts.example.com',
    },
};

const usePrefilledQueryClient = ({
    featureFlags,
    profile,
    skipPrefillDeploymentConfig,
}: {
    featureFlags?: CustomFeatureFlags;
    profile?: OnboardingProfile | null;
    skipPrefillDeploymentConfig?: boolean;
}) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                gcTime: 1000,
            },
        },
    });

    queryClient.setQueryData(QUERY_KEYS.FEATURE_FLAGS, {
        ...DEV_FEATURE_FLAGS,
        ...featureFlags,
    });

    if (profile !== null) {
        queryClient.setQueryData(QUERY_KEYS.USER_ONBOARDING_PROFILE, {
            organizations: [{ id: prefilledOrgId, status: AccountStatusDTO.ACTIVE }],
            hasAcceptedUserTermsAndConditions: true,
            ...profile,
        });
    }

    ['123', 'org-id', 'organization-id', prefilledOrgId].forEach((organizationId) => {
        const workspaceKey = QUERY_KEYS.WORKSPACES(organizationId);

        queryClient.setQueryData(workspaceKey, [
            getMockedWorkspace({ id: 'workspace-1', name: 'Workspace 1' }),
            getMockedWorkspace({ id: 'workspace-2', name: 'Workspace 2' }),
        ]);
    });

    if (!skipPrefillDeploymentConfig) {
        queryClient.setQueryData(['deployment-config', false], defaultDeploymentConfig);
        queryClient.setQueryData(['deployment-config', true], adminDeploymentConfig);
    }

    return queryClient;
};

export const RequiredProviders = ({
    children,
    featureFlags,
    initialEntries,
    profile,
    queryClient,
    skipPrefillDeploymentConfig,
    ...services
}: RequiredProvidersProps) => {
    const prefilledQueryClient = usePrefilledQueryClient({
        featureFlags,
        profile,
        skipPrefillDeploymentConfig,
    });

    return (
        <Suspense fallback={<IntelBrandedLoading />}>
            <Router initialEntries={initialEntries}>
                <AuthProvider>
                    <Toast />
                    <QueryClientProvider client={queryClient ?? prefilledQueryClient}>
                        <ThemeProvider theme={defaultTheme}>
                            <ApplicationServicesProvider useInMemoryEnvironment {...services}>
                                <TusUploadProvider>{children}</TusUploadProvider>
                            </ApplicationServicesProvider>
                        </ThemeProvider>
                    </QueryClientProvider>
                </AuthProvider>
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
