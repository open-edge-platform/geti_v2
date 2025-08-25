// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { isEqual } from 'lodash-es';

import { TrainingConfiguration } from '../../../../../../../../core/configurable-parameters/services/configuration.interface';
import { Accordion } from '../../ui/accordion/accordion.component';
import { LearningParametersList, LearningParametersType } from './learning-parameters-list.component';

interface LearningParametersProps {
    parameters: LearningParametersType;
    defaultParameters: LearningParametersType;
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
}

export const LearningParameters = ({
    parameters,
    defaultParameters,
    onUpdateTrainingConfiguration,
}: LearningParametersProps) => {
    const tag = isEqual(parameters, defaultParameters) ? 'Default' : 'Modified';

    return (
        <Accordion>
            <Accordion.Title>
                Learning parameters
                <Accordion.Tag ariaLabel={'Learning parameters tag'}>{tag}</Accordion.Tag>
            </Accordion.Title>
            <Accordion.Content>
                <Accordion.Description>Specify the details of the learning process</Accordion.Description>
                <Accordion.Divider marginY={'size-250'} />
                <LearningParametersList
                    parameters={parameters}
                    onUpdateTrainingConfiguration={onUpdateTrainingConfiguration}
                />
            </Accordion.Content>
        </Accordion>
    );
};
