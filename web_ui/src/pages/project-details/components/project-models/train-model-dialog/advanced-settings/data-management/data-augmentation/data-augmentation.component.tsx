// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { TrainingConfiguration } from '../../../../../../../../core/configurable-parameters/services/configuration.interface';
import { Accordion } from '../../ui/accordion/accordion.component';
import { isBoolEnableParameter } from '../../utils';
import {
    DataAugmentationParameters,
    DataAugmentationParametersList,
} from './data-augmentation-parameters-list.component';

interface DataAugmentationProps {
    parameters: DataAugmentationParameters;
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
}

export const isDataAugmentationEnabled = (parameters: DataAugmentationParameters): boolean => {
    return Object.values(parameters).some((parametersGroup) =>
        parametersGroup.some((parameter) => isBoolEnableParameter(parameter) && parameter.value === true)
    );
};

export const DataAugmentation = ({ parameters, onUpdateTrainingConfiguration }: DataAugmentationProps) => {
    const isEnabled = isDataAugmentationEnabled(parameters);

    return (
        <Accordion>
            <Accordion.Title>
                Data Augmentation<Accordion.Tag>{isEnabled ? 'Yes' : 'No'}</Accordion.Tag>
            </Accordion.Title>
            <Accordion.Content>
                <Accordion.Description>
                    Choose data augmentation transformations to enhance the diversity of available data for training
                    models.
                </Accordion.Description>
                <Accordion.Divider marginY={'size-250'} />
                <DataAugmentationParametersList
                    parameters={parameters}
                    onUpdateTrainingConfiguration={onUpdateTrainingConfiguration}
                />
            </Accordion.Content>
        </Accordion>
    );
};
