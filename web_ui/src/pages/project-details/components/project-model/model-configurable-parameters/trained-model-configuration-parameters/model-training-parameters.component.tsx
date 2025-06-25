// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { TrainedModelConfiguration } from '../../../../../../core/configurable-parameters/services/configuration.interface';
import { isConfigurationParameter } from '../../../../../../core/configurable-parameters/utils';
import { LearningParametersList } from '../../../project-models/train-model-dialog/advanced-settings/training/learning-parameters/learning-parameters-list.component';
import { Accordion } from '../../../project-models/train-model-dialog/advanced-settings/ui/accordion/accordion.component';

const isLearningParameterModified = (parameters: TrainedModelConfiguration['training']): boolean => {
    return !parameters.every((parameter) => {
        if (isConfigurationParameter(parameter)) {
            return parameter.defaultValue === parameter.value;
        }

        return Object.values(parameter).every((subParameter) => {
            return subParameter.every((subSubParameter) => {
                return subSubParameter.defaultValue === subSubParameter.value;
            });
        });
    });
};

export const ModelTrainingParameters = ({ parameters }: { parameters: TrainedModelConfiguration['training'] }) => {
    const tag = isLearningParameterModified(parameters) ? 'Modified' : 'Default';

    return (
        <Accordion>
            <Accordion.Title>
                Learning parameters
                <Accordion.Tag>{tag}</Accordion.Tag>
            </Accordion.Title>
            <Accordion.Content>
                <LearningParametersList isReadOnly parameters={parameters} />
            </Accordion.Content>
        </Accordion>
    );
};
