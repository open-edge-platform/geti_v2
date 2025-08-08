// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC, useRef, useState } from 'react';

import { Content, Flex, Grid, Heading, InlineAlert, minmax, Text, View } from '@geti/ui';
import { isEqual } from 'lodash-es';

import {
    ConfigurationParameter,
    NumberParameter,
    TrainingConfiguration,
} from '../../../../../../../../core/configurable-parameters/services/configuration.interface';
import { Accordion } from '../../ui/accordion/accordion.component';
import { ResetButton } from '../../ui/reset-button.component';
import { SubsetsDistributionSlider } from './subsets-distribution-slider/subsets-distribution-slider.component';
import { areSubsetsSizesValid, getSubsetsSizes, MAX_RATIO_VALUE } from './utils';

import styles from './training-subsets.module.scss';

interface SubsetDistributionStatsProps {
    trainingSize: number;
    validationSize: number;
    testSize: number;
}

const Tile: FC<{ color: string }> = ({ color }) => {
    return (
        <View height={'size-100'} width={'size-100'} borderRadius={'small'} UNSAFE_style={{ backgroundColor: color }} />
    );
};

const SubsetDistributionStat: FC<{ size: number; color: string; title: string }> = ({ size, color, title }) => {
    return (
        <Flex alignItems={'center'} gap={'size-50'}>
            <Tile color={color} />
            <span aria-label={`${title} subset size`}>
                {title}: {size}
            </span>
        </Flex>
    );
};

const SubsetDistributionStats: FC<SubsetDistributionStatsProps> = ({ trainingSize, validationSize, testSize }) => {
    return (
        <View gridArea={'counts'} backgroundColor={'static-gray-800'} borderRadius={'small'} padding={'size-100'}>
            <Flex alignItems={'center'} justifyContent={'space-between'} UNSAFE_className={styles.statsText}>
                <Flex alignItems={'center'} gap={'size-200'}>
                    <SubsetDistributionStat title={'Training'} color={'var(--training-subset)'} size={trainingSize} />
                    <SubsetDistributionStat
                        title={'Validation'}
                        color={'var(--validation-subset)'}
                        size={validationSize}
                    />
                    <SubsetDistributionStat title={'Test'} color={'var(--test-subset)'} size={testSize} />
                </Flex>
                <Text>
                    <Text UNSAFE_className={styles.totalStats}>Total: </Text>
                    {trainingSize + validationSize + testSize} media items
                </Text>
            </Flex>
        </View>
    );
};

interface SubsetsDistributionProps {
    trainingSubsetSize: number;
    validationSubsetSize: number;
    testSubsetSize: number;
    subsetsDistribution: number[];
    onSubsetsDistributionChange: (values: number[]) => void;
    onSubsetsDistributionChangeEnd: (values: number[]) => void;
    onSubsetsDistributionReset: () => void;
    subsetParameters: SubsetsParameters;
}

const SubsetsDistribution: FC<SubsetsDistributionProps> = ({
    subsetsDistribution,
    trainingSubsetSize,
    testSubsetSize,
    validationSubsetSize,
    onSubsetsDistributionChange,
    onSubsetsDistributionChangeEnd,
    onSubsetsDistributionReset,
    subsetParameters,
}) => {
    const handleSubsetDistributionChange = (values: number[] | number): void => {
        if (Array.isArray(values)) {
            if (!areSubsetsSizesValid(subsetParameters, values)) {
                return;
            }

            onSubsetsDistributionChange(values);
        }
    };

    const handleSubsetDistributionChangeEnd = (values: number[] | number): void => {
        if (Array.isArray(values)) {
            if (!areSubsetsSizesValid(subsetParameters, values)) {
                return;
            }

            onSubsetsDistributionChangeEnd(values);
        }
    };

    return (
        <View UNSAFE_className={styles.trainingSubsets}>
            <Grid
                areas={['label slider reset', '. counts .']}
                columns={['max-content', minmax('size-3400', '1fr'), 'max-content']}
                alignItems={'center'}
                columnGap={'size-250'}
            >
                <SubsetsDistributionSlider
                    aria-label={'Distribute samples'}
                    minValue={0}
                    maxValue={100}
                    step={1}
                    value={[subsetsDistribution[0], subsetsDistribution[1]]}
                    onChange={handleSubsetDistributionChange}
                    onChangeEnd={handleSubsetDistributionChangeEnd}
                    label={'Distribution'}
                />
                <ResetButton
                    gridArea={'reset'}
                    onPress={onSubsetsDistributionReset}
                    aria-label={'Reset training subsets'}
                />
                <SubsetDistributionStats
                    testSize={testSubsetSize}
                    trainingSize={trainingSubsetSize}
                    validationSize={validationSubsetSize}
                />
            </Grid>
        </View>
    );
};

type SubsetsParameters = TrainingConfiguration['datasetPreparation']['subsetSplit'];

interface TrainingSubsetsProps {
    hasSupportedModels: boolean;
    subsetsParameters: SubsetsParameters;
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
}

const TEST_SUBSET_KEY = 'test';
const VALIDATION_SUBSET_KEY = 'validation';
const TRAINING_SUBSET_KEY = 'training';

const getSubsets = (subsetsParameters: SubsetsParameters) => {
    const validationSubset = subsetsParameters.find(
        (parameter) => parameter.key === VALIDATION_SUBSET_KEY
    ) as NumberParameter;
    const trainingSubset = subsetsParameters.find(
        (parameter) => parameter.key === TRAINING_SUBSET_KEY
    ) as NumberParameter;

    return {
        trainingSubset,
        validationSubset,
    };
};

const TrainingSubsetsUnavailable = () => {
    return (
        <InlineAlert variant={'notice'}>
            <Heading>Training subsets configuration unavailable</Heading>
            <Content>
                The training, validation, and testing subsets are currently unavailable because the project does not
                contain enough media items to support a proper split.
                <br />
                To enable subset configuration, please add more media items so that each subset contains at least one
                item.
            </Content>
        </InlineAlert>
    );
};

const TrainingSubsetsChangedDistributionWarning = () => {
    return (
        <InlineAlert variant={'notice'}>
            <Heading>Additional configuration change required to apply new training subsets distribution</Heading>
            <Content>
                To apply the updated distribution of training, validation, and testing subsets, please go to{' '}
                {'"Training"'} tab, choose {'"Pre-trained weights"'}, and enable {'"Reshuffle subsets"'}.
                <br />
                This will reset your data splits and begin a new training process, replacing the current model.
            </Content>
        </InlineAlert>
    );
};

export const TrainingSubsets: FC<TrainingSubsetsProps> = ({
    hasSupportedModels,
    subsetsParameters,
    onUpdateTrainingConfiguration,
}) => {
    const { trainingSubset, validationSubset } = getSubsets(subsetsParameters);

    const prevSubsetParameters = useRef(subsetsParameters);

    const [subsetsDistribution, setSubsetsDistribution] = useState<number[]>([
        trainingSubset.value,
        trainingSubset.value + validationSubset.value,
    ]);

    const trainingSubsetRatio = subsetsDistribution[0];
    const validationSubsetRatio = subsetsDistribution[1] - trainingSubsetRatio;
    const testSubsetRatio = MAX_RATIO_VALUE - subsetsDistribution[1];

    const handleUpdateSubsetsConfiguration = (values: number[]): void => {
        onUpdateTrainingConfiguration((config) => {
            if (!config) return undefined;

            const newConfig = structuredClone(config);
            const trainingSubsetValue = values[0];
            const validationSubsetValue = values[1] - trainingSubsetValue;
            const testSubsetValue = MAX_RATIO_VALUE - values[1];

            const KEY_VALUE_MAP: Record<string, number> = {
                [TRAINING_SUBSET_KEY]: trainingSubsetValue,
                [VALIDATION_SUBSET_KEY]: validationSubsetValue,
                [TEST_SUBSET_KEY]: testSubsetValue,
            };

            newConfig.datasetPreparation.subsetSplit = config.datasetPreparation.subsetSplit.map((parameter) => {
                if ([TRAINING_SUBSET_KEY, TEST_SUBSET_KEY, VALIDATION_SUBSET_KEY].includes(parameter.key)) {
                    return {
                        ...parameter,
                        value: KEY_VALUE_MAP[parameter.key],
                    } as ConfigurationParameter;
                }

                return parameter;
            });

            return newConfig;
        });
    };

    const handleSubsetsConfigurationReset = (): void => {
        setSubsetsDistribution([
            trainingSubset.defaultValue,
            trainingSubset.defaultValue + validationSubset.defaultValue,
        ]);

        onUpdateTrainingConfiguration((config) => {
            if (config === undefined) return undefined;

            const newConfig = structuredClone(config);

            newConfig.datasetPreparation.subsetSplit = config.datasetPreparation.subsetSplit.map((parameter) => {
                if ([VALIDATION_SUBSET_KEY, TEST_SUBSET_KEY, TRAINING_SUBSET_KEY].includes(parameter.key)) {
                    return {
                        ...parameter,
                        value: parameter.defaultValue,
                    } as ConfigurationParameter;
                }

                return parameter;
            });

            return newConfig;
        });
    };

    const { trainingSubsetSize, validationSubsetSize, testSubsetSize } = getSubsetsSizes(
        subsetsParameters,
        validationSubsetRatio,
        testSubsetRatio
    );

    const subsetsSizesValid = areSubsetsSizesValid(subsetsParameters, subsetsDistribution);
    const isChangedDistributionWarningVisible =
        hasSupportedModels && !isEqual(prevSubsetParameters.current, subsetsParameters);

    return (
        <Accordion>
            <Accordion.Title>
                Training subsets
                <Accordion.Tag ariaLabel={'Training subsets tag'}>
                    {trainingSubsetRatio}/{validationSubsetRatio}/{testSubsetRatio}%
                </Accordion.Tag>
            </Accordion.Title>
            <Accordion.Content>
                <Accordion.Description>
                    Specify the distribution of annotated samples over the training, validation and test subsets. <br />
                    Note: items that have already been used for training will stay in the same subset even if these
                    parameters are changed.
                    <br />
                    Each subset must have at least one media item.
                </Accordion.Description>
                <Accordion.Divider marginY={'size-250'} />
                <View UNSAFE_className={subsetsSizesValid ? undefined : styles.disabled}>
                    <SubsetsDistribution
                        subsetParameters={subsetsParameters}
                        subsetsDistribution={subsetsDistribution}
                        onSubsetsDistributionChange={setSubsetsDistribution}
                        testSubsetSize={testSubsetSize}
                        trainingSubsetSize={trainingSubsetSize}
                        validationSubsetSize={validationSubsetSize}
                        onSubsetsDistributionChangeEnd={handleUpdateSubsetsConfiguration}
                        onSubsetsDistributionReset={handleSubsetsConfigurationReset}
                    />
                </View>

                <Flex direction={'column'} gap={'size-200'} marginTop={'size-200'}>
                    {!subsetsSizesValid && <TrainingSubsetsUnavailable />}
                    {isChangedDistributionWarningVisible && <TrainingSubsetsChangedDistributionWarning />}
                </Flex>
            </Accordion.Content>
        </Accordion>
    );
};
