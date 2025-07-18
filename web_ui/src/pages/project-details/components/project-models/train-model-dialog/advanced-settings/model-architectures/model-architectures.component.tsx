// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC, useState } from 'react';

import { Flex, View } from '@geti/ui';
import { orderBy } from 'lodash-es';

import { PerformanceCategory } from '../../../../../../../core/supported-algorithms/dtos/supported-algorithms.interface';
import { SupportedAlgorithm } from '../../../../../../../core/supported-algorithms/supported-algorithms.interface';
import { SortWidget } from '../../../../../../../shared/components/sort-widget/sort-widget.component';
import { ModelArchitecturesMainContent } from './model-architectures-main-content.component';
import { SortingOptions } from './utils';

type SortingHandler = (templates: SupportedAlgorithm[]) => SupportedAlgorithm[];

const sortingHandlers: Record<SortingOptions, SortingHandler> = {
    [SortingOptions.RELEVANCE_DESC]: (templates) =>
        orderBy(templates, (algorithm) => algorithm.performanceCategory === PerformanceCategory.OTHER, 'desc'),
    [SortingOptions.RELEVANCE_ASC]: (templates) =>
        orderBy(templates, (algorithm) => algorithm.performanceCategory === PerformanceCategory.OTHER, 'asc'),
    [SortingOptions.ACCURACY_ASC]: (templates) =>
        orderBy(templates, (algorithm) => algorithm.performanceRatings.accuracy, 'asc'),
    [SortingOptions.ACCURACY_DESC]: (templates) =>
        orderBy(templates, (algorithm) => algorithm.performanceRatings.accuracy, 'desc'),
    [SortingOptions.INFERENCE_SPEED_ASC]: (templates) =>
        orderBy(templates, (algorithm) => algorithm.performanceRatings.inferenceSpeed, 'asc'),
    [SortingOptions.INFERENCE_SPEED_DESC]: (templates) =>
        orderBy(templates, (algorithm) => algorithm.performanceRatings.inferenceSpeed, 'desc'),
    [SortingOptions.TRAINING_TIME_ASC]: (templates) =>
        orderBy(templates, (algorithm) => algorithm.performanceRatings.trainingTime, 'asc'),
    [SortingOptions.TRAINING_TIME_DESC]: (templates) =>
        orderBy(templates, (algorithm) => algorithm.performanceRatings.trainingTime, 'desc'),
    [SortingOptions.NAME_ASC]: (templates) => orderBy(templates, (algorithm) => algorithm.name, 'asc'),
    [SortingOptions.NAME_DESC]: (templates) => orderBy(templates, (algorithm) => algorithm.name, 'desc'),
};

const SORT_OPTIONS = [
    [
        {
            key: SortingOptions.RELEVANCE_ASC,
            name: 'Relevance',
        },
        {
            key: SortingOptions.RELEVANCE_DESC,
            name: 'Relevance',
        },
    ],
    [
        {
            key: SortingOptions.NAME_ASC,
            name: 'Name',
        },
        {
            key: SortingOptions.NAME_DESC,
            name: 'Name',
        },
    ],
    [
        {
            key: SortingOptions.INFERENCE_SPEED_ASC,
            name: 'Inference speed',
        },
        {
            key: SortingOptions.INFERENCE_SPEED_DESC,
            name: 'Inference speed',
        },
    ],
    [
        {
            key: SortingOptions.TRAINING_TIME_ASC,
            name: 'Training time',
        },
        {
            key: SortingOptions.TRAINING_TIME_DESC,
            name: 'Training time',
        },
    ],
    [
        {
            key: SortingOptions.ACCURACY_ASC,
            name: 'Accuracy',
        },
        {
            key: SortingOptions.ACCURACY_DESC,
            name: 'Accuracy',
        },
    ],
];

interface ModelArchitecturesProps {
    algorithms: SupportedAlgorithm[];
    selectedModelTemplateId: string | null;
    onChangeSelectedTemplateId: (modelTemplateId: string | null) => void;
    activeModelTemplateId: string | null;
}

export const ModelArchitectures: FC<ModelArchitecturesProps> = ({
    algorithms,
    selectedModelTemplateId,
    onChangeSelectedTemplateId,
    activeModelTemplateId,
}) => {
    const [sortBy, setSortBy] = useState<SortingOptions>(SortingOptions.RELEVANCE_ASC);
    const sortedAlgorithms = sortingHandlers[sortBy](algorithms);

    return (
        <Flex direction={'column'} gap={'size-100'}>
            <Flex direction={'row-reverse'}>
                <SortWidget sortBy={sortBy} onSort={setSortBy} items={SORT_OPTIONS} />
            </Flex>
            <View flex={1}>
                <ModelArchitecturesMainContent
                    algorithms={sortedAlgorithms}
                    selectedModelTemplateId={selectedModelTemplateId}
                    onChangeSelectedTemplateId={onChangeSelectedTemplateId}
                    activeModelTemplateId={activeModelTemplateId}
                    sortBy={sortBy}
                />
            </View>
        </Flex>
    );
};
