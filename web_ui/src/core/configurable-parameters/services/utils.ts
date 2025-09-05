// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { isEmpty, isObject } from 'lodash-es';
import { v4 as uuidV4 } from 'uuid';

import {
    ConfigurableParametersDTO,
    ConfigurableParametersGroupsDTO,
    ConfigurableParametersParamsDTO,
    ConfigurableParametersTaskChainDTO,
    EntityIdentifierDTO,
} from '../dtos/configurable-parameters.interface';
import {
    ConfigurationParameterDTO,
    ProjectConfigurationDTO,
    ProjectConfigurationUploadPayloadDTO,
    StaticParameterDTO,
    TrainedModelConfigurationDTO,
    TrainingConfigurationDTO,
    TrainingConfigurationUpdatePayloadDTO,
    TrainingParametersDTO,
} from '../dtos/configuration.interface';
import { isConfigurationParameter } from '../utils';
import {
    ConfigurableParametersComponents,
    ConfigurableParametersGroups,
    ConfigurableParametersParams,
    ConfigurableParametersTaskChain,
    EntityIdentifier,
} from './configurable-parameters.interface';
import {
    ConfigurationParameter,
    KeyValueParameter,
    ProjectConfiguration,
    ProjectConfigurationUploadPayload,
    StaticParameter,
    TrainedModelConfiguration,
    TrainingConfiguration,
    TrainingConfigurationUpdatePayload,
    TrainingParameters,
} from './configuration.interface';

const getConfigParametersField = (
    parameters: ConfigurableParametersParamsDTO[],
    id: string,
    editable = false
): ConfigurableParametersParams[] =>
    parameters.map((parameter) => {
        const parameterId = `${id}::${uuidV4()}`;

        if (parameter.data_type === 'boolean') {
            const { data_type, default_value, template_type, ...rest } = parameter;
            return {
                ...rest,
                editable,
                id: parameterId,
                dataType: data_type,
                templateType: template_type,
                defaultValue: default_value,
            };
        }
        if (parameter.template_type === 'selectable') {
            if (parameter.data_type === 'string') {
                const { default_value, template_type, data_type, ...rest } = parameter;
                return {
                    ...rest,
                    editable,
                    id: parameterId,
                    dataType: data_type,
                    templateType: template_type,
                    defaultValue: default_value,
                };
            }
            const { default_value, template_type, data_type, ...rest } = parameter;
            return {
                ...rest,
                editable,
                id: parameterId,
                dataType: data_type,
                templateType: template_type,
                defaultValue: default_value,
            };
        } else if (parameter.template_type === 'input') {
            const { data_type, template_type, default_value, max_value, min_value, ...rest } = parameter;
            return {
                ...rest,
                editable,
                id: parameterId,
                dataType: data_type,
                templateType: template_type,
                defaultValue: default_value,
                minValue: min_value,
                maxValue: max_value,
            };
        }
        throw Error('This template type is not supported');
    });

const getConfigEntityIdentifier = (entityIdentifierDTO: EntityIdentifierDTO): EntityIdentifier => {
    if (entityIdentifierDTO.type === 'HYPER_PARAMETER_GROUP') {
        const { type, model_storage_id, workspace_id, group_name } = entityIdentifierDTO;
        return {
            type,
            modelStorageId: model_storage_id,
            workspaceId: workspace_id,
            groupName: group_name,
        };
    } else if (entityIdentifierDTO.type === 'HYPER_PARAMETERS') {
        const { type, model_storage_id, workspace_id } = entityIdentifierDTO;
        return {
            type,
            modelStorageId: model_storage_id,
            workspaceId: workspace_id,
        };
    }
    const { type, component, project_id, task_id, workspace_id } = entityIdentifierDTO;
    return {
        type,
        component,
        projectId: project_id,
        taskId: task_id,
        workspaceId: workspace_id,
    };
};

const hasComponentOnlyParameters = (
    parameters: ConfigurableParametersParamsDTO[],
    taskComponentId: string,
    editable: boolean
): ConfigurableParametersParams[] => {
    return getConfigParametersField(parameters, taskComponentId, editable);
};

const hasComponentOnlyGroups = (
    groups: ConfigurableParametersGroupsDTO[],
    taskComponentId: string,
    editable: boolean
): ConfigurableParametersGroups[] => {
    return groups.map((group) => {
        const groupId = uuidV4();
        const parameterIdPrefix = `${taskComponentId}::${groupId}`;
        const newParameters: ConfigurableParametersParams[] = getConfigParametersField(
            group.parameters,
            parameterIdPrefix,
            editable
        );
        return {
            ...group,
            id: groupId,
            parameters: newParameters,
        };
    });
};

export const getModelConfigEntity = (
    data: ConfigurableParametersTaskChainDTO,
    editable = false
): ConfigurableParametersTaskChain => {
    const { task_id, task_title, components } = data;
    const newComponents: ConfigurableParametersComponents[] = components.map((component) => {
        const { description, header, id, entity_identifier } = component;
        const taskComponentId = `${task_id}::${id}`;
        const entityIdentifier: EntityIdentifier = getConfigEntityIdentifier(entity_identifier);
        const groups = component.groups
            ? hasComponentOnlyGroups(component.groups, taskComponentId, editable)
            : undefined;
        const parameters = component.parameters
            ? hasComponentOnlyParameters(component.parameters, taskComponentId, editable)
            : undefined;
        return {
            id,
            header,
            description,
            entityIdentifier,
            parameters,
            groups,
        };
    });

    return {
        taskId: task_id,
        taskTitle: task_title,
        components: newComponents,
    };
};

export const getConfigParametersEntity = (data: ConfigurableParametersDTO): ConfigurableParametersTaskChain[] => {
    const { global, task_chain } = data;
    const taskChain: ConfigurableParametersTaskChain[] = task_chain.map((taskConfigParameter) =>
        getModelConfigEntity(taskConfigParameter, true)
    );

    const taskId = 'global-config';
    const newGlobal: ConfigurableParametersTaskChain = {
        taskId,
        taskTitle: 'Global',
        components: global.map(({ parameters, header, description, entity_identifier, id }) => ({
            id,
            header,
            description,
            entityIdentifier: getConfigEntityIdentifier(entity_identifier),
            type: 'PARAMETER_GROUP',
            name: header.toLowerCase().split(' ').join('-'),
            parameters: getConfigParametersField(parameters, `${taskId}::${id}`, true),
        })),
    };

    return [newGlobal, ...taskChain];
};

export const getParameter = (parameter: ConfigurationParameterDTO): ConfigurationParameter => {
    if (parameter.type === 'int' || parameter.type === 'float') {
        const { type, description, key, default_value, max_value, min_value, value, name } = parameter;

        return {
            key,
            type,
            name,
            value,
            description,
            defaultValue: default_value,
            maxValue: max_value,
            minValue: min_value,
        };
    }

    if (parameter.type === 'bool') {
        const { type, description, key, default_value, value, name } = parameter;

        return {
            key,
            type,
            name,
            value,
            description,
            defaultValue: default_value,
        };
    }

    if (parameter.type === 'enum') {
        const { key, type, name, description, value, default_value, allowed_values } = parameter;

        return {
            key,
            type,
            name,
            description,
            allowedValues: allowed_values,
            value,
            defaultValue: default_value,
        };
    }

    if (parameter.type === 'array') {
        const { key, type, name, description, value, default_value } = parameter;

        return {
            key,
            type,
            name,
            description,
            value,
            defaultValue: default_value,
        };
    }

    throw new Error(`${parameter.type} is not supported.`);
};

export const getStaticParameter = (parameter: StaticParameterDTO): StaticParameter => {
    const { key, name, description, value } = parameter;

    return {
        key,
        name,
        description,
        value,
    };
};

export const getProjectConfigurationEntity = ({ task_configs }: ProjectConfigurationDTO): ProjectConfiguration => {
    const taskConfigs = task_configs.map((taskConfig) => {
        const { task_id, training, auto_training } = taskConfig;

        return {
            taskId: task_id,
            training: {
                constraints: training.constraints.map(getParameter),
            },
            autoTraining: auto_training.map(getParameter),
        };
    });
    return {
        taskConfigs,
    };
};

const getParametersObject = (
    parameters: Record<string, ConfigurationParameterDTO[]>
): Record<string, ConfigurationParameter[]> => {
    return Object.entries(parameters).reduce<Record<string, ConfigurationParameter[]>>((acc, [key, value]) => {
        acc[key] = value.map(getParameter);
        return acc;
    }, {});
};

const isParameterDTO = (input: unknown): input is ConfigurationParameterDTO => {
    return isObject(input) && 'key' in input && 'name' in input && 'description' in input;
};

const getTrainingParameters = (config: TrainingParametersDTO): TrainingParameters => {
    return config.map((item) => {
        if (isParameterDTO(item)) {
            return getParameter(item);
        }

        return Object.entries(item).reduce((acc, [key, parameters]) => {
            return {
                ...acc,
                [key]: parameters.map(getParameter),
            };
        }, {});
    });
};

export const getTrainingConfigurationEntity = (config: TrainingConfigurationDTO): TrainingConfiguration => {
    const { task_id, training, dataset_preparation, evaluation } = config;

    return {
        taskId: task_id,
        datasetPreparation: {
            augmentation: getParametersObject(dataset_preparation.augmentation),
            filtering: getParametersObject(dataset_preparation.filtering),
            subsetSplit: dataset_preparation.subset_split.map(getParameter),
        },
        training: getTrainingParameters(training),
        evaluation: evaluation.map(getParameter),
    };
};

export const getTrainedModelConfigurationEntity = (config: TrainedModelConfigurationDTO): TrainedModelConfiguration => {
    const { task_id, training, dataset_preparation, evaluation, advanced_configuration } = config;

    return {
        taskId: task_id,
        datasetPreparation: {
            augmentation: getParametersObject(dataset_preparation.augmentation),
        },
        training: getTrainingParameters(training),
        evaluation: evaluation.map(getParameter),
        // TODO: remove optional chaining when backend will return empty array instead of undefined
        advancedConfiguration: advanced_configuration?.map(getStaticParameter),
    };
};

const getKeyValueParameter = (parameter: ConfigurationParameter | KeyValueParameter): KeyValueParameter => {
    return {
        key: parameter.key,
        value: parameter.value,
    };
};

const getObjectEntitiesInKeyValueFormat = (
    input: Record<string, ConfigurationParameter[]>
): Record<string, KeyValueParameter[]> => {
    return Object.entries(input).reduce<Record<string, KeyValueParameter[]>>((acc, [key, parameters]) => {
        return {
            ...acc,
            [key]: parameters.map(getKeyValueParameter),
        };
    }, {});
};

export const getTrainingConfigurationUpdatePayloadDTO = (
    payload: TrainingConfigurationUpdatePayload
): TrainingConfigurationUpdatePayloadDTO => {
    const trainingConfigurationUpdatePayloadDTO: TrainingConfigurationUpdatePayloadDTO = {
        task_id: payload.taskId,
    };

    if (payload.datasetPreparation !== undefined && !isEmpty(payload.datasetPreparation)) {
        if (!isEmpty(payload.datasetPreparation.subsetSplit)) {
            trainingConfigurationUpdatePayloadDTO.dataset_preparation = {
                subset_split: payload.datasetPreparation.subsetSplit.map(getKeyValueParameter),
            };
        }

        if (!isEmpty(payload.datasetPreparation.filtering)) {
            const filteringPayload = getObjectEntitiesInKeyValueFormat(payload.datasetPreparation.filtering);

            trainingConfigurationUpdatePayloadDTO.dataset_preparation = {
                ...trainingConfigurationUpdatePayloadDTO.dataset_preparation,
                filtering: filteringPayload,
            };
        }

        if (!isEmpty(payload.datasetPreparation.augmentation)) {
            const augmentationPayload = getObjectEntitiesInKeyValueFormat(payload.datasetPreparation.augmentation);

            trainingConfigurationUpdatePayloadDTO.dataset_preparation = {
                ...trainingConfigurationUpdatePayloadDTO.dataset_preparation,
                augmentation: augmentationPayload,
            };
        }
    }

    if (!isEmpty(payload.training)) {
        trainingConfigurationUpdatePayloadDTO.training = payload.training.map((parameters) => {
            if (isConfigurationParameter(parameters)) {
                return getKeyValueParameter(parameters);
            }

            return getObjectEntitiesInKeyValueFormat(parameters);
        });
    }

    if (!isEmpty(payload.evaluation)) {
        trainingConfigurationUpdatePayloadDTO.evaluation = payload.evaluation.map(getKeyValueParameter);
    }

    return trainingConfigurationUpdatePayloadDTO;
};

export const getProjectConfigurationUploadPayloadDTO = (
    payload: ProjectConfigurationUploadPayload
): ProjectConfigurationUploadPayloadDTO => {
    const projectConfigurationUploadPayloadDTO: ProjectConfigurationUploadPayloadDTO = {
        task_configs: payload.taskConfigs.map((taskConfig) => {
            const { taskId, training, autoTraining } = taskConfig;

            return {
                task_id: taskId,
                training: training
                    ? {
                          constraints: training.constraints.map((parameter) => ({
                              key: parameter.key,
                              value: parameter.value,
                          })),
                      }
                    : undefined,
                auto_training: autoTraining?.map((parameter) => ({
                    key: parameter.key,
                    value: parameter.value,
                })),
            };
        }),
    };

    return projectConfigurationUploadPayloadDTO;
};
