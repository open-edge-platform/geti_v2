// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC, useState } from 'react';

import { Flex, Grid, minmax, Text, View } from '@geti/ui';

import {
    ConfigurationParameter,
    NumberParameter,
    TrainingConfiguration,
} from '../../../../../../../../core/configurable-parameters/services/configuration.interface';
import { Accordion } from '../../ui/accordion/accordion.component';
import { ResetButton } from '../../ui/reset-button.component';
import { SubsetsDistributionSlider } from './subsets-distribution-slider/subsets-distribution-slider.component';
import { getSubsetsSizes } from './utils';

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
}

const SubsetsDistribution: FC<SubsetsDistributionProps> = ({
    subsetsDistribution,
    trainingSubsetSize,
    testSubsetSize,
    validationSubsetSize,
    onSubsetsDistributionChange,
    onSubsetsDistributionChangeEnd,
    onSubsetsDistributionReset,
}) => {
    const handleSubsetDistributionChange = (values: number[] | number): void => {
        if (Array.isArray(values)) {
            const [startRange, endRange] = values;

            // validation subset cannot be empty
            if (startRange === endRange) {
                return;
            }

            onSubsetsDistributionChange(values);
        }
    };

    const handleSubsetDistributionChangeEnd = (values: number[] | number): void => {
        if (Array.isArray(values)) {
            const [startRange, endRange] = values;

            // validation subset cannot be empty
            if (startRange === endRange) {
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

const MAX_RATIO_VALUE = 100;

type SubsetsConfiguration = TrainingConfiguration['datasetPreparation']['subsetSplit'];

interface TrainingSubsetsProps {
    subsetsConfiguration: SubsetsConfiguration;
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
}

const TEST_SUBSET_KEY = 'test';
const VALIDATION_SUBSET_KEY = 'validation';
const TRAINING_SUBSET_KEY = 'training';

const getSubsets = (subsetsConfiguration: SubsetsConfiguration) => {
    const validationSubset = subsetsConfiguration.find(
        (parameter) => parameter.key === VALIDATION_SUBSET_KEY
    ) as NumberParameter;
    const trainingSubset = subsetsConfiguration.find(
        (parameter) => parameter.key === TRAINING_SUBSET_KEY
    ) as NumberParameter;

    return {
        trainingSubset,
        validationSubset,
    };
};

export const TrainingSubsets: FC<TrainingSubsetsProps> = ({ subsetsConfiguration, onUpdateTrainingConfiguration }) => {
    const { trainingSubset, validationSubset } = getSubsets(subsetsConfiguration);

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
        subsetsConfiguration,
        validationSubsetRatio,
        testSubsetRatio
    );

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
                    Specify the distribution of annotated samples over the training, validation and test subsets. Note:
                    items that have already been used for training will stay in the same subset even if these parameters
                    are changed.
                </Accordion.Description>
                <Accordion.Divider marginY={'size-250'} />
                <SubsetsDistribution
                    subsetsDistribution={subsetsDistribution}
                    onSubsetsDistributionChange={setSubsetsDistribution}
                    testSubsetSize={testSubsetSize}
                    trainingSubsetSize={trainingSubsetSize}
                    validationSubsetSize={validationSubsetSize}
                    onSubsetsDistributionChangeEnd={handleUpdateSubsetsConfiguration}
                    onSubsetsDistributionReset={handleSubsetsConfigurationReset}
                />
            </Accordion.Content>
        </Accordion>
    );
};
