// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC } from 'react';

import { View } from '@geti/ui';
import { isEmpty } from 'lodash-es';

import { TrainingConfiguration } from '../../../../../../../core/configurable-parameters/services/configuration.interface';
import { FineTuneParameters } from './fine-tune-parameters.component';
import { LearningParameters } from './learning-parameters/learning-parameters.component';

interface TrainingProps {
    trainFromScratch: boolean;
    onTrainFromScratchChange: (trainFromScratch: boolean) => void;

    trainingConfiguration: TrainingConfiguration;
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;

    isReshufflingSubsetsEnabled: boolean;
    onReshufflingSubsetsEnabledChange: (reshufflingSubsetsEnabled: boolean) => void;
}

export const Training: FC<TrainingProps> = ({
    trainFromScratch,
    onTrainFromScratchChange,
    trainingConfiguration,
    onReshufflingSubsetsEnabledChange,
    isReshufflingSubsetsEnabled,
    onUpdateTrainingConfiguration,
}) => {
    return (
        <View>
            <FineTuneParameters
                trainFromScratch={trainFromScratch}
                onTrainFromScratchChange={onTrainFromScratchChange}
                isReshufflingSubsetsEnabled={isReshufflingSubsetsEnabled}
                onReshufflingSubsetsEnabledChange={onReshufflingSubsetsEnabledChange}
            />
            {!isEmpty(trainingConfiguration.training) && (
                <LearningParameters
                    parameters={trainingConfiguration.training}
                    onUpdateTrainingConfiguration={onUpdateTrainingConfiguration}
                />
            )}
        </View>
    );
};
