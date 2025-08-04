// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useState } from 'react';

import { useFeatureFlags } from '@geti/core/src/feature-flags/hooks/use-feature-flags.hook';
import { isEmpty, isNumber } from 'lodash-es';

import {
    useTrainingConfigurationMutation,
    useTrainingConfigurationQuery,
} from '../../../../../core/configurable-parameters/hooks/use-training-configuration.hook';
import { TrainingConfiguration } from '../../../../../core/configurable-parameters/services/configuration.interface';
import { TrainingBodyDTO } from '../../../../../core/models/dtos/train-model.interface';
import { useModels } from '../../../../../core/models/hooks/use-models.hook';
import { ModelsGroups } from '../../../../../core/models/models.interface';
import { isActiveModel } from '../../../../../core/models/utils';
import { ProjectIdentifier } from '../../../../../core/projects/core.interface';
import { Task } from '../../../../../core/projects/task.interface';
import { useTasksWithSupportedAlgorithms } from '../../../../../core/supported-algorithms/hooks/use-tasks-with-supported-algorithms';
import { SupportedAlgorithm } from '../../../../../core/supported-algorithms/supported-algorithms.interface';
import { useProjectIdentifier } from '../../../../../hooks/use-project-identifier/use-project-identifier';
import { isNotCropTask } from '../../../../../shared/utils';
import { useTotalCreditPrice } from '../../../hooks/use-credits-to-consume.hook';
import { useProject } from '../../../providers/project-provider/project-provider.component';
import { getTrainingBodyDTO } from '../legacy-train-model-dialog/utils';

enum TrainModelMode {
    BASIC = 'Basic',
    ADVANCED_SETTINGS = 'Advanced settings',
}

const getActiveModelTemplateId = (
    modelsGroups: ModelsGroups[] | undefined,
    algorithms: SupportedAlgorithm[],
    taskId: string
): string | null => {
    if (isEmpty(modelsGroups)) {
        return algorithms.find((algorithm) => algorithm.isDefaultAlgorithm)?.modelTemplateId ?? null;
    }

    return (
        modelsGroups?.find((modelGroup) => modelGroup.taskId === taskId && modelGroup.modelVersions.some(isActiveModel))
            ?.modelTemplateId ?? null
    );
};

const useTrainingConfiguration = ({
    projectIdentifier,
    selectedTaskId,
    selectedModelTemplateId,
}: {
    projectIdentifier: ProjectIdentifier;
    selectedTaskId: string;
    selectedModelTemplateId: string | null;
}) => {
    const { data } = useTrainingConfigurationQuery(projectIdentifier, {
        modelManifestId: selectedModelTemplateId,
        taskId: selectedTaskId,
    });

    const [trainingConfiguration, setTrainingConfiguration] = useState<TrainingConfiguration | undefined>(data);

    useEffect(() => {
        if (data === undefined) {
            return;
        }

        setTrainingConfiguration(data);
    }, [data]);

    return [trainingConfiguration, setTrainingConfiguration, data] as const;
};

const useSelectedModelTemplateId = ({
    algorithms,
    selectedTaskId,
    models,
}: {
    algorithms: SupportedAlgorithm[];
    selectedTaskId: string;
    models: ModelsGroups[] | undefined;
}) => {
    const activeModelTemplateId = getActiveModelTemplateId(models, algorithms, selectedTaskId);
    const [selectedModelTemplateId, setSelectedModelTemplateId] = useState<string | null>(activeModelTemplateId);

    useEffect(() => {
        if (selectedModelTemplateId !== null) {
            return;
        }

        setSelectedModelTemplateId(activeModelTemplateId);
    }, [selectedModelTemplateId, activeModelTemplateId]);

    return [selectedModelTemplateId, setSelectedModelTemplateId, activeModelTemplateId] as const;
};

export const useTrainModelState = () => {
    const [mode, setMode] = useState<TrainModelMode>(TrainModelMode.BASIC);

    const projectIdentifier = useProjectIdentifier();
    const { project, isTaskChainProject } = useProject();
    const { useProjectModelsQuery } = useModels();
    const { data: models } = useProjectModelsQuery();
    const { getCreditPrice } = useTotalCreditPrice();
    const { FEATURE_FLAG_CREDIT_SYSTEM } = useFeatureFlags();

    const tasks = project.tasks.filter(isNotCropTask);
    const [task] = tasks;
    const { tasksWithSupportedAlgorithms } = useTasksWithSupportedAlgorithms();
    const [selectedTask, setSelectedTask] = useState<Task>(task);
    const algorithms = (tasksWithSupportedAlgorithms[selectedTask.id] ?? []) as SupportedAlgorithm[];

    const [selectedModelTemplateId, setSelectedModelTemplateId, activeModelTemplateId] = useSelectedModelTemplateId({
        algorithms,
        selectedTaskId: selectedTask.id,
        models,
    });

    const isBasicMode = mode === TrainModelMode.BASIC;

    const [trainingConfiguration, setTrainingConfiguration, defaultTrainingConfiguration] = useTrainingConfiguration({
        projectIdentifier,
        selectedTaskId: selectedTask.id,
        selectedModelTemplateId,
    });

    const [isReshufflingSubsetsEnabled, setIsReshufflingSubsetsEnabled] = useState<boolean>(false);
    const [trainFromScratch, setTrainFromScratch] = useState<boolean>(false);

    const openAdvancedSettingsMode = (): void => {
        setMode(TrainModelMode.ADVANCED_SETTINGS);
    };

    const constructTrainingBodyDTO = (): TrainingBodyDTO => {
        const { totalMedias } = getCreditPrice(selectedTask.id);
        const maxTrainingDatasetSize = FEATURE_FLAG_CREDIT_SYSTEM && isNumber(totalMedias) ? totalMedias : undefined;

        return getTrainingBodyDTO({
            modelTemplateId: selectedModelTemplateId ?? '',
            taskId: selectedTask.id,
            trainFromScratch,
            isReshufflingSubsetsEnabled,
            maxTrainingDatasetSize,
        });
    };

    const handleTrainFromScratchChange = (newTrainFromScratch: boolean): void => {
        setTrainFromScratch(newTrainFromScratch);

        if (newTrainFromScratch === false) {
            setIsReshufflingSubsetsEnabled(false);
        }
    };

    const changeSelectedModelTemplateId = (newModelTemplateId: string | null): void => {
        setSelectedModelTemplateId(newModelTemplateId);

        handleTrainFromScratchChange(false);
    };

    const changeTask = (newTask: Task): void => {
        setSelectedTask(newTask);

        const newAlgorithms = (tasksWithSupportedAlgorithms[newTask.id] ?? []) as SupportedAlgorithm[];
        const newActiveModelTemplateId = getActiveModelTemplateId(models, newAlgorithms, newTask.id);

        changeSelectedModelTemplateId(newActiveModelTemplateId);
    };

    const useTrainModel = () => {
        const trainingConfigurationMutation = useTrainingConfigurationMutation();

        const { useTrainModelMutation } = useModels();
        const trainModelMutation = useTrainModelMutation();

        const handleTrainModel = (onSuccess?: () => void) => {
            // 1. If we are in basic mode, we can directly train the model, without updating the training configuration.
            // 2. If we are in advanced settings mode, we need to update the training configuration first.
            // 2.1. If the training configuration fails, we don't want to train the model.
            // 2.2. If the training configuration succeeds, we can train the model with the updated configuration.
            // 3. Train model is called.
            // 3.1. If train model fails, we revert the training configuration to the default one.
            // 3.2. If train model succeeds, we call the onSuccess callback if provided.

            if (isBasicMode) {
                trainModelMutation.mutate(
                    {
                        projectIdentifier,
                        body: constructTrainingBodyDTO(),
                    },
                    {
                        onSuccess,
                    }
                );
                return;
            }

            if (trainingConfiguration === undefined || defaultTrainingConfiguration === undefined) {
                return;
            }

            trainingConfigurationMutation.mutate(
                {
                    projectIdentifier,
                    payload: trainingConfiguration,
                    queryParameters: {
                        taskId: selectedTask.id,
                        modelManifestId: selectedModelTemplateId,
                    },
                },
                {
                    onSuccess: () => {
                        trainModelMutation.mutate(
                            { projectIdentifier, body: constructTrainingBodyDTO() },
                            {
                                onSuccess,
                                onError: () => {
                                    trainingConfigurationMutation.mutate({
                                        projectIdentifier,
                                        payload: defaultTrainingConfiguration,
                                        queryParameters: {
                                            taskId: selectedTask.id,
                                            modelManifestId: selectedModelTemplateId,
                                        },
                                    });
                                },
                            }
                        );
                    },
                }
            );
        };

        return {
            mutate: handleTrainModel,
            isPending: trainModelMutation.isPending || trainingConfigurationMutation.isPending,
            error: trainModelMutation.error?.message || trainingConfigurationMutation.error?.message,
        };
    };

    return {
        isBasicMode,
        openAdvancedSettingsMode,
        selectedTask,
        tasks,
        activeModelTemplateId,
        selectedModelTemplateId,
        algorithms,
        changeTask,
        changeSelectedTemplateId: changeSelectedModelTemplateId,
        isTaskChainProject,
        isReshufflingSubsetsEnabled,
        changeReshufflingSubsetsEnabled: setIsReshufflingSubsetsEnabled,
        trainFromScratch,
        changeTrainFromScratch: handleTrainFromScratchChange,
        trainingConfiguration,
        updateTrainingConfiguration: setTrainingConfiguration,
        trainModel: useTrainModel(),
    } as const;
};
