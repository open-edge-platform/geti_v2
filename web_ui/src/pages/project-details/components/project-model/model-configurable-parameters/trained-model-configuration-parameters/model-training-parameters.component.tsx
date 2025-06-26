// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { TrainedModelConfiguration } from '../../../../../../core/configurable-parameters/services/configuration.interface';
import { LearningParametersList } from '../../../project-models/train-model-dialog/advanced-settings/training/learning-parameters/learning-parameters-list.component';
import { Accordion } from '../../../project-models/train-model-dialog/advanced-settings/ui/accordion/accordion.component';
import { isLearningParameterModified } from './utils';

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
