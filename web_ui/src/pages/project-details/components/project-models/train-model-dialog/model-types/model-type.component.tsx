// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC, ReactNode } from 'react';

import { Divider, Flex, Grid, Heading, Radio, RadioGroup, repeat, Tooltip, TooltipTrigger, View } from '@geti/ui';
import { clsx } from 'clsx';
import { isFunction } from 'lodash-es';

import { SupportedAlgorithm } from '../../../../../../core/supported-algorithms/supported-algorithms.interface';
import { InfoTooltip } from '../../../../../../shared/components/info-tooltip/info-tooltip.component';
import { isDeprecatedAlgorithm } from '../../legacy-train-model-dialog/model-templates-selection/utils';
import { ModelArchitectureTooltipText } from '../../model-architecture-tooltip.component';
import { ActiveModelTag } from '../../models-container/model-card/active-model-tag.component';
import { DeprecatedTag } from '../../models-container/model-card/deprecated-model-tag.component';
import { SelectableCard } from '../selectable-card/selectable-card.component';
import { AttributeRating, Ratings } from './attribute-rating/attribute-rating.component';

import classes from './model-type.module.scss';

interface ModelTypeProps {
    name: string;
    algorithm: SupportedAlgorithm;
    selectedModelTemplateId: string | null;
    onChangeSelectedTemplateId: (modelTemplateId: string | null) => void;
    activeModelTemplateId: string | null;
    renderTag: (() => ReactNode) | undefined;
}

interface TemplateRatingProps {
    ratings: {
        inferenceSpeed: Ratings;
        trainingTime: Ratings;
        accuracy: Ratings;
    };
}

const TemplateRating: FC<TemplateRatingProps> = ({ ratings }) => {
    return (
        <Grid columns={repeat(3, '1fr')} justifyContent={'space-evenly'} gap={'size-250'}>
            <AttributeRating name={'Inference speed'} rating={ratings.inferenceSpeed} />
            <AttributeRating name={'Training time'} rating={ratings.trainingTime} />
            <AttributeRating name={'Accuracy'} rating={ratings.accuracy} />
        </Grid>
    );
};

interface ModelAttributeProps {
    value: string;
    title: string;
    gridArea: string;
}

const ModelAttribute = ({ title, value, gridArea }: ModelAttributeProps) => {
    return (
        <>
            <Heading margin={0} UNSAFE_className={classes.attributeTitle} gridArea={`${gridArea}-title`}>
                {title}
            </Heading>
            <span
                aria-label={title}
                style={{
                    gridArea: `${gridArea}-attribute`,
                }}
            >
                {value}
            </span>
        </>
    );
};

type ModelAttributesProps = Pick<SupportedAlgorithm, 'trainableParameters' | 'gigaflops'>;

const ModelAttributes = ({ trainableParameters, gigaflops }: ModelAttributesProps) => {
    return (
        <Grid
            columns={repeat(2, 'max-content')}
            gap={'size-200'}
            areas={['model-size-title complexity-title', 'model-size-attribute complexity-attribute']}
        >
            <ModelAttribute gridArea={'model-size'} title={'Model size'} value={`${trainableParameters} M`} />
            <ModelAttribute gridArea={'complexity'} title={'Complexity'} value={`${gigaflops} GFlops`} />
        </Grid>
    );
};

type PerformanceRating = SupportedAlgorithm['performanceRatings'][keyof SupportedAlgorithm['performanceRatings']];

const RATING_MAP: Record<PerformanceRating, Ratings> = {
    1: 'LOW',
    2: 'MEDIUM',
    3: 'HIGH',
};

export const ModelType: FC<ModelTypeProps> = ({
    name,
    algorithm,
    selectedModelTemplateId,
    onChangeSelectedTemplateId,
    activeModelTemplateId,
    renderTag,
}) => {
    const { modelTemplateId, lifecycleStage, description, performanceRatings } = algorithm;
    const isSelected = selectedModelTemplateId === modelTemplateId;

    const shouldShowActiveTag = modelTemplateId === activeModelTemplateId;

    const isDeprecated = isDeprecatedAlgorithm(lifecycleStage);

    const handlePress = () => {
        onChangeSelectedTemplateId(modelTemplateId);
    };

    return (
        <SelectableCard
            isSelected={isSelected}
            handleOnPress={handlePress}
            text={name}
            headerContent={
                <>
                    <View marginBottom={'size-50'}>
                        <RadioGroup
                            isEmphasized
                            aria-label={`Select ${name}`}
                            onChange={handlePress}
                            value={selectedModelTemplateId}
                            minWidth={0}
                            UNSAFE_className={classes.radioGroup}
                        >
                            <Flex alignItems={'center'} gap={'size-50'}>
                                <View minWidth={0}>
                                    <TooltipTrigger placement={'bottom'}>
                                        <Radio value={modelTemplateId} aria-label={name}>
                                            <Heading
                                                UNSAFE_className={clsx(classes.trainTemplateName, {
                                                    [classes.selected]: isSelected,
                                                })}
                                            >
                                                {name}
                                            </Heading>
                                        </Radio>
                                        <Tooltip>{name}</Tooltip>
                                    </TooltipTrigger>
                                </View>
                                <InfoTooltip
                                    id={`${name.toLocaleLowerCase()}-summary-id`}
                                    tooltipText={
                                        <ModelArchitectureTooltipText
                                            description={description}
                                            isDeprecated={isDeprecated}
                                        />
                                    }
                                    iconColor={isSelected ? 'var(--energy-blue)' : undefined}
                                />
                            </Flex>
                        </RadioGroup>
                    </View>
                    <Flex alignItems={'center'} gap={'size-100'}>
                        {shouldShowActiveTag && <ActiveModelTag id={name} />}
                        {isFunction(renderTag) && renderTag()}
                        {isDeprecated && <DeprecatedTag id={`${name.toLocaleLowerCase()}`} />}
                    </Flex>
                </>
            }
            descriptionContent={
                <Flex direction={'column'} gap={'size-200'}>
                    <TemplateRating
                        ratings={{
                            accuracy: RATING_MAP[performanceRatings.accuracy],
                            trainingTime: RATING_MAP[performanceRatings.trainingTime],
                            inferenceSpeed: RATING_MAP[performanceRatings.inferenceSpeed],
                        }}
                    />
                    <Divider size={'S'} />
                    <ModelAttributes
                        gigaflops={algorithm.gigaflops}
                        trainableParameters={algorithm.trainableParameters}
                    />
                </Flex>
            }
        />
    );
};
