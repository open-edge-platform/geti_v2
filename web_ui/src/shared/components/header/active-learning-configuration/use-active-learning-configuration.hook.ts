// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useFeatureFlags } from '@geti/core/src/feature-flags/hooks/use-feature-flags.hook';

import {
    useProjectConfigurationMutation,
    useProjectConfigurationQuery,
} from '../../../../core/configurable-parameters/hooks/use-project-configuration.hook';
import { ProjectConfigurationUploadPayload } from '../../../../core/configurable-parameters/services/configuration.interface';
import { ProjectIdentifier } from '../../../../core/projects/core.interface';
import { Task } from '../../../../core/projects/task.interface';
import { isNotCropTask } from '../../../utils';
import { useAutoTrainingTasksConfig } from './use-tasks-auto-training-config.hook';
import {
    getAutoTrainingEnabledParameter,
    getDynamicRequiredAnnotationsParameter,
    getRequiredImagesAutoTrainingParameter,
    UseActiveLearningConfigurationReturnType,
} from './util';

export const useActiveLearningConfiguration = (
    projectIdentifier: ProjectIdentifier,
    tasks: Task[]
): UseActiveLearningConfigurationReturnType => {
    const { FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS } = useFeatureFlags();
    const { data: projectConfiguration, isPending } = useProjectConfigurationQuery(projectIdentifier, {
        enabled: FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS,
    });

    const projectConfigurationMutation = useProjectConfigurationMutation();
    const notCropTasks = tasks.filter(isNotCropTask);

    const updateProjectConfiguration = (payload: ProjectConfigurationUploadPayload) => {
        projectConfigurationMutation.mutate({
            projectIdentifier,
            payload,
        });
    };

    const updateAutoTraining = (taskId: string, value: boolean) => {
        updateProjectConfiguration({
            taskConfigs: [
                {
                    taskId,
                    autoTraining: [
                        {
                            key: 'enable',
                            value,
                        },
                    ],
                },
            ],
        });
    };

    const updateDynamicRequiredAnnotations = (taskId: string, value: boolean) => {
        updateProjectConfiguration({
            taskConfigs: [
                {
                    taskId,
                    autoTraining: [
                        {
                            key: 'enable_dynamic_required_annotations',
                            value,
                        },
                    ],
                },
            ],
        });
    };

    const updateRequiredImagesAutoTraining = (taskId: string, value: number) => {
        updateProjectConfiguration({
            taskConfigs: [
                {
                    taskId,
                    autoTraining: [
                        {
                            key: 'min_images_per_label',
                            value,
                        },
                    ],
                },
            ],
        });
    };

    const autoTrainingTaskConfigLegacy = useAutoTrainingTasksConfig(projectIdentifier, tasks);

    if (FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS) {
        const autoTrainingTasks = notCropTasks.map((task) => {
            const taskProjectConfiguration = projectConfiguration?.taskConfigs.find(
                (taskConfig) => taskConfig.taskId === task.id
            );

            if (taskProjectConfiguration === undefined) {
                return {
                    task,
                    trainingConfig: undefined,
                    dynamicRequiredAnnotationsConfig: undefined,
                    requiredImagesAutoTrainingConfig: undefined,
                };
            }

            return {
                task,
                trainingConfig: getAutoTrainingEnabledParameter(taskProjectConfiguration.autoTraining),
                dynamicRequiredAnnotationsConfig: getDynamicRequiredAnnotationsParameter(
                    taskProjectConfiguration.autoTraining
                ),
                requiredImagesAutoTrainingConfig: getRequiredImagesAutoTrainingParameter(
                    taskProjectConfiguration.autoTraining
                ),
            };
        });

        return {
            isPending,
            autoTrainingTasks,
            updateAutoTraining,
            updateDynamicRequiredAnnotations,
            updateRequiredImagesAutoTraining,
        };
    }

    return autoTrainingTaskConfigLegacy;
};
