// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useApplicationServices } from '@geti/core/src/services/application-services-provider.component';
import { toast } from '@geti/ui';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { getErrorMessage } from '../../../../packages/core/src/services/utils';
import { ProjectImport, ProjectImportIdentifier } from '../project.interface';
import { ImportOptions } from '../services/project-service.interface';

interface UseImportProject {
    useImportProjectMutation: () => UseMutationResult<
        ProjectImport,
        AxiosError,
        {
            identifier: ProjectImportIdentifier;
            options: ImportOptions;
        }
    >;
}

export const IMPORT_STATUS_ERROR = 'Project is not uploaded due to an error.';

export const useImportProject = (): UseImportProject => {
    const { projectService } = useApplicationServices();

    const useImportProjectMutation = () =>
        useMutation<
            ProjectImport,
            AxiosError,
            {
                identifier: ProjectImportIdentifier;
                options: ImportOptions;
            }
        >({
            mutationFn: ({ identifier, options }) => projectService.importProject(identifier, options),

            onError: (error: AxiosError) => {
                toast({ message: getErrorMessage(error), type: 'error' });
            },
        });

    return {
        useImportProjectMutation,
    };
};
