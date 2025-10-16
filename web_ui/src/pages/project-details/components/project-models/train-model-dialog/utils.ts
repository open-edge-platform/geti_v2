// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ConfigurableParametersTaskChain } from '../../../../../core/configurable-parameters/services/configurable-parameters.interface';
import { TrainingBodyDTO } from '../../../../../core/models/dtos/train-model.interface';
import { getTrainingConfigParametersDTO } from '../utils';

interface TrainingBody {
    taskId: string;
    trainFromScratch: boolean;
    isReshufflingSubsetsEnabled: boolean;
    modelTemplateId: string | undefined;
    configParameters?: ConfigurableParametersTaskChain | undefined;
    maxTrainingDatasetSize?: number;
}

export const getTrainingBodyDTO = ({
    taskId,
    trainFromScratch,
    modelTemplateId,
    configParameters,
    maxTrainingDatasetSize,
    isReshufflingSubsetsEnabled,
}: TrainingBody): TrainingBodyDTO => {
    // send config parameters only when custom training was selected
    return {
        train_from_scratch: trainFromScratch,
        reshuffle_subsets: isReshufflingSubsetsEnabled,
        model_template_id: modelTemplateId,
        task_id: taskId,
        hyper_parameters: configParameters ? getTrainingConfigParametersDTO(configParameters) : undefined,
        max_training_dataset_size: maxTrainingDatasetSize,
    };
};
