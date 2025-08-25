// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useApplicationServices } from '@geti/core/src/services/application-services-provider.component';
import { toast } from '@geti/ui';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { getErrorMessage } from '../../../../packages/core/src/services/utils';
import { ProjectIdentifier } from '../core.interface';
import { EXPORT_PROJECT_MODELS_OPTIONS, ProjectExport } from '../project.interface';

interface UseExportProject {
    exportProjectMutation: UseMutationResult<ProjectExport, AxiosError, ExportProjectMutationVariables>;
}

interface ExportProjectMutationVariables {
    projectIdentifier: ProjectIdentifier;
    selectedModelExportOption?: EXPORT_PROJECT_MODELS_OPTIONS;
}

export const DOWNLOAD_STATUS_ERROR = 'Project was not downloaded due to an error.';

export const useExportProject = (): UseExportProject => {
    const service = useApplicationServices().projectService;

    const exportProjectMutation = useMutation<ProjectExport, AxiosError, ExportProjectMutationVariables>({
        mutationFn: service.exportProject,
        onError: (error: AxiosError) => {
            toast({ message: getErrorMessage(error), type: 'error' });
        },
    });

    return { exportProjectMutation };
};
