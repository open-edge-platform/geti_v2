// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ConfigurableParametersComponentsBodyDTO } from '../../../../core/configurable-parameters/dtos/configurable-parameters.interface';
import {
    ConfigurableParametersComponents,
    ConfigurableParametersTaskChain,
} from '../../../../core/configurable-parameters/services/configurable-parameters.interface';
import { getComponentsDTO } from '../../../../core/configurable-parameters/utils';
import { ModelGroupsAlgorithmDetails, ModelsGroups } from '../../../../core/models/models.interface';
import {
    LifecycleStage,
    PerformanceCategory,
} from '../../../../core/supported-algorithms/dtos/supported-algorithms.interface';
import { TaskWithSupportedAlgorithms } from '../../../../core/supported-algorithms/supported-algorithms.interface';
import { hasEqualId } from '../../../../shared/utils';

export const getSelectedComponent = (
    configParameters: ConfigurableParametersTaskChain[] | undefined,
    selectedComponentId: string | undefined
): ConfigurableParametersComponents | undefined => {
    return configParameters?.map((config) => config.components.find(hasEqualId(selectedComponentId))).find(Boolean);
};

export const getTrainingConfigParametersDTO = ({
    components,
}: ConfigurableParametersTaskChain): { components: ConfigurableParametersComponentsBodyDTO[] } => {
    return {
        components: getComponentsDTO(components),
    };
};

export const addAlgorithmDetails =
    (tasksWithSupportedAlgorithms: TaskWithSupportedAlgorithms) =>
    (model: ModelsGroups): ModelGroupsAlgorithmDetails => {
        const match = tasksWithSupportedAlgorithms[model.taskId]?.find(
            ({ modelTemplateId }) => modelTemplateId === model.modelTemplateId
        );

        return {
            ...model,
            isDefaultAlgorithm: match?.isDefaultAlgorithm ?? false,
            performanceCategory: match?.performanceCategory ?? PerformanceCategory.OTHER,
            complexity: match?.gigaflops ?? null,
        };
    };

export enum ModelConfigurationOption {
    LATEST_CONFIGURATION = 'LATEST_CONFIGURATION',
    MANUAL_CONFIGURATION = 'MANUAL_CONFIGURATION',
}

export const LATEST_MODEL_CONFIG_TOOLTIP_TEXT =
    'The system will use the latest model configurable parameters ' +
    'for the training, in case no model trained for this architecture before, ' +
    'the system will use the default configurable parameters.';

export const CUSTOM_MODEL_CONFIG_TOOLTIP_TEXT =
    'Currently only facilitates training of the existing pre-defined architectures ' +
    'with custom training parameters.';

export const isDeprecatedAlgorithm = (lifecycleStage: LifecycleStage) => lifecycleStage === LifecycleStage.DEPRECATED;

export const isObsoleteAlgorithm = (lifecycleStage: LifecycleStage) => lifecycleStage === LifecycleStage.OBSOLETE;
