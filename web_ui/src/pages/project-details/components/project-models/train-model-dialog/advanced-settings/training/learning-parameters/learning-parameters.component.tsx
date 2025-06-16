// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useRef } from 'react';

import { Flex } from '@geti/ui';
import { isEqual } from 'lodash-es';

import { TrainingConfiguration } from '../../../../../../../../core/configurable-parameters/services/configuration.interface';
import { Accordion } from '../../ui/accordion/accordion.component';
import { LearningParametersList, LearningParametersType } from './learning-parameters-list.component';

interface LearningParametersProps {
    parameters: LearningParametersType;
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
}

export const LearningParameters = ({ parameters, onUpdateTrainingConfiguration }: LearningParametersProps) => {
    const parametersRef = useRef(parameters);
    const tag = isEqual(parametersRef.current, parameters) ? 'Default' : 'Modified';

    return (
        <Accordion>
            <Accordion.Title>
                Learning parameters
                <Accordion.Tag>{tag}</Accordion.Tag>
            </Accordion.Title>
            <Accordion.Content>
                <Accordion.Description>Specify the details of the learning process</Accordion.Description>
                <Accordion.Divider marginY={'size-250'} />
                <Flex direction={'column'} width={'100%'} gap={'size-300'}>
                    <LearningParametersList
                        parameters={parameters}
                        onUpdateTrainingConfiguration={onUpdateTrainingConfiguration}
                    />
                </Flex>
            </Accordion.Content>
        </Accordion>
    );
};
