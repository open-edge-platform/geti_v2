// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useApplicationServices } from '@geti/core/src/services/application-services-provider.component';
import { getErrorMessage } from '@geti/core/src/services/utils';
import { toast } from '@geti/ui';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { ProjectIdentifier } from '../../projects/core.interface';
import { DownloadDeploymentPackageBody } from '../services/code-deployment-service.interface';

interface UseDownloadDeploymentPackageMutation {
    projectIdentifier: ProjectIdentifier;
    body: DownloadDeploymentPackageBody;
}

interface UseCodeDeployment {
    useDownloadDeploymentPackageMutation: () => UseMutationResult<
        void,
        AxiosError,
        UseDownloadDeploymentPackageMutation
    >;
}

export const useCodeDeployment = (): UseCodeDeployment => {
    const { codeDeploymentService } = useApplicationServices();

    const onError = (error: AxiosError) => {
        toast({ message: getErrorMessage(error), type: 'error' });
    };

    const useDownloadDeploymentPackageMutation = (): UseMutationResult<
        void,
        AxiosError,
        UseDownloadDeploymentPackageMutation
    > => {
        return useMutation({
            mutationFn: ({ projectIdentifier, body }) =>
                codeDeploymentService.downloadDeploymentPackage(projectIdentifier, body),
            onError,
        });
    };

    return {
        useDownloadDeploymentPackageMutation,
    };
};
