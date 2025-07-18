// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC, Key } from 'react';

import { ModelGroupsAlgorithmDetails } from '../../../../core/models/models.interface';
import {
    sortModelsGroupsByActiveModel,
    sortModelsGroupsByComplexity,
    sortModelsGroupsByCreationTime,
    sortModelsGroupsByModelSize,
    sortModelsGroupsByScore,
} from '../../../../core/models/utils';
import { SortDirection } from '../../../../core/shared/query-parameters';
import { SortWidget } from '../../../../shared/components/sort-widget/sort-widget.component';

export enum ModelsSortingOptions {
    ACTIVE_MODEL_ASC = 'Active model asc',
    ACTIVE_MODEL_DESC = 'Active model desc',
    CREATION_TIME_ASC = 'Creation time asc',
    CREATION_TIME_DESC = 'Creation time desc',
    SCORE_ASC = 'Score asc',
    SCORE_DESC = 'Score desc',
    SIZE_ASC = 'Size asc',
    SIZE_DESC = 'Size desc',
    COMPLEXITY_ASC = 'Complexity asc',
    COMPLEXITY_DESC = 'Complexity desc',
}

export const MODEL_SORTING_FUNCTIONS: Record<
    ModelsSortingOptions,
    (modelsGroups: ModelGroupsAlgorithmDetails[]) => ModelGroupsAlgorithmDetails[]
> = {
    [ModelsSortingOptions.SCORE_ASC]: (modelsGroups) => sortModelsGroupsByScore(modelsGroups, SortDirection.ASC),
    [ModelsSortingOptions.SCORE_DESC]: (modelsGroups) => sortModelsGroupsByScore(modelsGroups, SortDirection.DESC),
    [ModelsSortingOptions.COMPLEXITY_ASC]: (modelsGroups) =>
        sortModelsGroupsByComplexity(modelsGroups, SortDirection.ASC),
    [ModelsSortingOptions.COMPLEXITY_DESC]: (modelsGroups) =>
        sortModelsGroupsByComplexity(modelsGroups, SortDirection.DESC),
    [ModelsSortingOptions.CREATION_TIME_ASC]: (modelsGroups) =>
        sortModelsGroupsByCreationTime(modelsGroups, SortDirection.ASC),
    [ModelsSortingOptions.CREATION_TIME_DESC]: (modelsGroups) =>
        sortModelsGroupsByCreationTime(modelsGroups, SortDirection.DESC),
    [ModelsSortingOptions.SIZE_ASC]: (modelsGroups) => sortModelsGroupsByModelSize(modelsGroups, SortDirection.ASC),
    [ModelsSortingOptions.SIZE_DESC]: (modelsGroups) => sortModelsGroupsByModelSize(modelsGroups, SortDirection.DESC),
    [ModelsSortingOptions.ACTIVE_MODEL_ASC]: (modelsGroups) =>
        sortModelsGroupsByActiveModel(modelsGroups, SortDirection.ASC),
    [ModelsSortingOptions.ACTIVE_MODEL_DESC]: (modelsGroups) =>
        sortModelsGroupsByActiveModel(modelsGroups, SortDirection.DESC),
};

const MODELS_SORTING_OPTIONS = [
    [
        {
            key: ModelsSortingOptions.ACTIVE_MODEL_ASC,
            name: 'Active model',
        },
        {
            key: ModelsSortingOptions.ACTIVE_MODEL_DESC,
            name: 'Active model',
        },
    ],
    [
        {
            key: ModelsSortingOptions.CREATION_TIME_ASC,
            name: 'Creation time',
        },
        {
            key: ModelsSortingOptions.CREATION_TIME_DESC,
            name: 'Creation time',
        },
    ],
    [
        {
            key: ModelsSortingOptions.SCORE_ASC,
            name: 'Score',
        },
        {
            key: ModelsSortingOptions.SCORE_DESC,
            name: 'Score',
        },
    ],
    [
        {
            key: ModelsSortingOptions.SIZE_ASC,
            name: 'Size',
        },
        {
            key: ModelsSortingOptions.SIZE_DESC,
            name: 'Size',
        },
    ],
    [
        {
            key: ModelsSortingOptions.COMPLEXITY_ASC,
            name: 'Complexity',
        },
        {
            key: ModelsSortingOptions.COMPLEXITY_DESC,
            name: 'Complexity',
        },
    ],
];

export const ModelsSorting: FC<{ selectedSortingOption: ModelsSortingOptions; onSort: (key: Key) => void }> = ({
    onSort,
    selectedSortingOption,
}) => {
    return (
        <SortWidget
            sortBy={selectedSortingOption}
            onSort={onSort}
            items={MODELS_SORTING_OPTIONS}
            ariaLabel={'Sort models'}
        />
    );
};
