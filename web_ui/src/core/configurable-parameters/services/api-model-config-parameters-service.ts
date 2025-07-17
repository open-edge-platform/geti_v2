// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { apiClient } from '@geti/core';

import { CreateApiService } from '../../../../packages/core/src/services/create-api-service.interface';
import { API_URLS } from '../../../../packages/core/src/services/urls';
import { ProjectIdentifier } from '../../projects/core.interface';
import {
    ConfigurableParametersDTO,
    ConfigurableParametersReconfigureDTO,
    ConfigurableParametersTaskChainDTO,
} from '../dtos/configurable-parameters.interface';
import {
    ProjectConfigurationDTO,
    TrainedModelConfigurationDTO,
    TrainingConfigurationDTO,
} from '../dtos/configuration.interface';
import { ConfigurableParametersTaskChain } from './configurable-parameters.interface';
import {
    ProjectConfiguration,
    ProjectConfigurationUploadPayload,
    TrainedModelConfiguration,
    TrainingConfiguration,
    TrainingConfigurationUpdatePayload,
} from './configuration.interface';
import {
    getConfigParametersEntity,
    getModelConfigEntity,
    getProjectConfigurationEntity,
    getProjectConfigurationUploadPayloadDTO,
    getTrainedModelConfigurationEntity,
    getTrainingConfigurationEntity,
    getTrainingConfigurationUpdatePayloadDTO,
} from './utils';

export interface TrainingConfigurationQueryParameters {
    taskId: string;
    modelManifestId: string | null;
}

export interface TrainedModelConfigurationQueryParameters {
    taskId: string;
    modelId: string;
}

export interface CreateApiModelConfigParametersService {
    /**
     * @deprecated Please use getTrainingConfiguration instead
     */
    getModelConfigParameters: (
        projectIdentifier: ProjectIdentifier,
        taskId: string,
        modelId?: string,
        modelTemplateId?: string | null,
        editable?: boolean
    ) => Promise<ConfigurableParametersTaskChain>;

    /**
     * @deprecated Please use getTrainingConfiguration instead
     */
    getConfigParameters: (projectIdentifier: ProjectIdentifier) => Promise<ConfigurableParametersTaskChain[]>;

    reconfigureParameters: (
        projectIdentifier: ProjectIdentifier,
        body: ConfigurableParametersReconfigureDTO
    ) => Promise<void>;

    getProjectConfiguration: (projectIdentifier: ProjectIdentifier) => Promise<ProjectConfiguration>;
    updateProjectConfiguration: (
        projectIdentifier: ProjectIdentifier,
        payload: ProjectConfigurationUploadPayload
    ) => Promise<void>;

    getTrainingConfiguration: (
        projectIdentifier: ProjectIdentifier,
        queryParameters?: TrainingConfigurationQueryParameters
    ) => Promise<TrainingConfiguration>;
    updateTrainingConfiguration: (
        projectIdentifier: ProjectIdentifier,
        payload: TrainingConfigurationUpdatePayload,
        queryParameters: TrainingConfigurationQueryParameters
    ) => Promise<void>;

    getTrainedModelConfiguration: (
        projectIdentifier: ProjectIdentifier,
        queryParameters: TrainedModelConfigurationQueryParameters
    ) => Promise<TrainedModelConfiguration>;
}

export const createApiModelConfigParametersService: CreateApiService<CreateApiModelConfigParametersService> = (
    { instance, router } = { instance: apiClient, router: API_URLS }
) => {
    const getModelConfigParameters = async (
        projectIdentifier: ProjectIdentifier,
        taskId: string,
        modelId?: string,
        modelTemplateId?: string | null,
        editable?: boolean
    ): Promise<ConfigurableParametersTaskChain> => {
        const { data } = await instance.get<ConfigurableParametersTaskChainDTO>(
            router.MODEL_CONFIG_PARAMETERS(projectIdentifier, taskId, modelId, modelTemplateId)
        );

        return getModelConfigEntity(data, editable);
    };

    const getConfigParameters = async (
        projectIdentifier: ProjectIdentifier
    ): Promise<ConfigurableParametersTaskChain[]> => {
        const { data } = await instance.get<ConfigurableParametersDTO>(
            router.CONFIGURATION_PARAMETERS(projectIdentifier)
        );

        return getConfigParametersEntity(data);
    };

    const reconfigureParameters = async (
        projectIdentifier: ProjectIdentifier,
        body: ConfigurableParametersReconfigureDTO
    ) => {
        await instance.post(router.CONFIGURATION_PARAMETERS(projectIdentifier), body);
    };

    const getTrainingConfiguration: CreateApiModelConfigParametersService['getTrainingConfiguration'] = async (
        projectIdentifier,
        queryParameters
    ) => {
        const { data } = await instance.get<TrainingConfigurationDTO>(
            router.CONFIGURATION.TRAINING(projectIdentifier),
            {
                params: {
                    task_id: queryParameters?.taskId,
                    model_manifest_id: queryParameters?.modelManifestId,
                },
            }
        );

        return getTrainingConfigurationEntity(data);
    };

    const getTrainedModelConfiguration: CreateApiModelConfigParametersService['getTrainedModelConfiguration'] = async (
        projectIdentifier,
        queryParameters
    ) => {
        const { data } = await instance.get<TrainedModelConfigurationDTO>(
            router.CONFIGURATION.TRAINING(projectIdentifier),
            {
                params: {
                    model_id: queryParameters.modelId,
                    task_id: queryParameters.taskId,
                },
            }
        );

        return getTrainedModelConfigurationEntity(data);
    };

    const getProjectConfiguration: CreateApiModelConfigParametersService['getProjectConfiguration'] = async (
        projectIdentifier
    ) => {
        const { data } = await instance.get<ProjectConfigurationDTO>(router.CONFIGURATION.PROJECT(projectIdentifier));

        return getProjectConfigurationEntity(data);
    };

    const updateTrainingConfiguration: CreateApiModelConfigParametersService['updateTrainingConfiguration'] = async (
        projectIdentifier,
        payload,
        queryParameters
    ) => {
        const payloadDTO = getTrainingConfigurationUpdatePayloadDTO(payload);

        await instance.patch(router.CONFIGURATION.TRAINING(projectIdentifier), payloadDTO, {
            params: {
                task_id: queryParameters.taskId,
                model_manifest_id: queryParameters.modelManifestId,
            },
        });
    };

    const updateProjectConfiguration: CreateApiModelConfigParametersService['updateProjectConfiguration'] = async (
        projectIdentifier,
        payload
    ) => {
        const payloadDTO = getProjectConfigurationUploadPayloadDTO(payload);

        await instance.patch(router.CONFIGURATION.PROJECT(projectIdentifier), payloadDTO);
    };

    return {
        getModelConfigParameters,
        getConfigParameters,
        reconfigureParameters,

        getProjectConfiguration,
        updateProjectConfiguration,

        getTrainingConfiguration,
        updateTrainingConfiguration,

        getTrainedModelConfiguration,
    };
};
