// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC } from 'react';

import { Checkbox, Flex, Radio, RadioGroup } from '@geti/ui';
import { Link } from 'react-router-dom';

import { useDocsUrl } from '../../../../../../../hooks/use-docs-url/use-docs-url.hook';
import { InfoTooltip } from '../../../../../../../shared/components/info-tooltip/info-tooltip.component';
import { Accordion } from '../ui/accordion/accordion.component';

import styles from './fine-tune-parameters.module.scss';

interface FineTuneParametersProps {
    trainFromScratch: boolean;
    onTrainFromScratchChange: (trainFromScratch: boolean) => void;

    onReshufflingSubsetsEnabledChange: (isChecked: boolean) => void;
    isReshufflingSubsetsEnabled: boolean;
}

enum TRAINING_WEIGHTS {
    PRE_TRAINED_WEIGHTS = 'Pre-trained weights',
    PREVIOUS_TRAINING_WEIGHTS = 'Previous training weights',
}

const ADVANCED_SETTINGS_URL = 'docs/user-guide/geti-fundamentals/model-training-and-optimization/#advanced-settings';

export const FineTuneParameters: FC<FineTuneParametersProps> = ({
    trainFromScratch,
    onTrainFromScratchChange,
    isReshufflingSubsetsEnabled,
    onReshufflingSubsetsEnabledChange,
}) => {
    const docsUrl = useDocsUrl();
    const originalModelUrl = `${docsUrl}${ADVANCED_SETTINGS_URL}`;

    const trainingWeight = trainFromScratch
        ? TRAINING_WEIGHTS.PRE_TRAINED_WEIGHTS
        : TRAINING_WEIGHTS.PREVIOUS_TRAINING_WEIGHTS;

    const handleTrainingWeightsChange = (value: string): void => {
        if (value === TRAINING_WEIGHTS.PRE_TRAINED_WEIGHTS) {
            onTrainFromScratchChange(true);
        } else {
            onTrainFromScratchChange(false);
        }
    };

    return (
        <Accordion>
            <Accordion.Title>
                Fine-tune parameters{' '}
                <Accordion.Tag ariaLabel={'Fine-tune parameters tag'}>{trainingWeight}</Accordion.Tag>
            </Accordion.Title>
            <Accordion.Content>
                <Accordion.Description>
                    Fine-tuning is the process of adapting a pre-trained model as the starting point for learning new
                    tasks.
                </Accordion.Description>
                <Accordion.Divider marginY={'size-250'} />
                <RadioGroup label={'Training weights'} value={trainingWeight} onChange={handleTrainingWeightsChange}>
                    <Radio value={TRAINING_WEIGHTS.PREVIOUS_TRAINING_WEIGHTS}>
                        Previous training weights - fine-tune the previous version of your model
                    </Radio>
                    <Flex alignItems={'center'}>
                        <Radio value={TRAINING_WEIGHTS.PRE_TRAINED_WEIGHTS} marginEnd={'size-65'}>
                            Pre-trained weights - fine-tune the
                        </Radio>
                        <Link to={originalModelUrl} className={styles.originalModelLink}>
                            original model
                        </Link>
                    </Flex>
                </RadioGroup>

                <Flex gap={'size-100'} alignItems={'center'} marginTop={'size-100'}>
                    <Checkbox
                        isEmphasized
                        isSelected={isReshufflingSubsetsEnabled}
                        onChange={onReshufflingSubsetsEnabledChange}
                        UNSAFE_className={styles.trainModelCheckbox}
                        isDisabled={trainingWeight === TRAINING_WEIGHTS.PREVIOUS_TRAINING_WEIGHTS}
                    >
                        Reshuffle subsets
                    </Checkbox>
                    <InfoTooltip
                        tooltipText={
                            // eslint-disable-next-line max-len
                            'Reassign all dataset items to train, validation, and test subsets from scratch. Previous splits will not be retained. This option is accessible for Pre-trained weights.'
                        }
                    />
                </Flex>
            </Accordion.Content>
        </Accordion>
    );
};
