// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC } from 'react';

import { View } from '@geti/ui';

import {
    ConfigurationParameter,
    TrainingConfiguration,
} from '../../../../../../../core/configurable-parameters/services/configuration.interface';
import { FineTuneParameters } from './fine-tune-parameters.component';
import { LearningParameters } from './learning-parameters.component';

interface TrainingProps {
    trainFromScratch: boolean;
    onTrainFromScratchChange: (trainFromScratch: boolean) => void;
    trainingConfiguration: TrainingConfiguration;

    isReshufflingSubsetsEnabled: boolean;
    onReshufflingSubsetsEnabledChange: (reshufflingSubsetsEnabled: boolean) => void;
}

export const Training: FC<TrainingProps> = ({
    trainFromScratch,
    onTrainFromScratchChange,
    onReshufflingSubsetsEnabledChange,
    isReshufflingSubsetsEnabled,
    trainingConfiguration: _trainingConfiguration,
}) => {
    const learningParameters: ConfigurationParameter[] = [];

    return (
        <View>
            <FineTuneParameters
                trainFromScratch={trainFromScratch}
                onTrainFromScratchChange={onTrainFromScratchChange}
                isReshufflingSubsetsEnabled={isReshufflingSubsetsEnabled}
                onReshufflingSubsetsEnabledChange={onReshufflingSubsetsEnabledChange}
            />
            <LearningParameters parameters={learningParameters} />
        </View>
    );
};
