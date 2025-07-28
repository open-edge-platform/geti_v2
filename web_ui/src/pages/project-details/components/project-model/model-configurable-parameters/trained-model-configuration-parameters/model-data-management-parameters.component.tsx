// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Flex, Text, View } from '@geti/ui';
import { isEmpty, noop } from 'lodash-es';

import { TrainedModelConfiguration } from '../../../../../../core/configurable-parameters/services/configuration.interface';
import { DataAugmentationParametersList } from '../../../project-models/train-model-dialog/advanced-settings/data-management/data-augmentation/data-augmentation-parameters-list.component';
import { isDataAugmentationEnabled } from '../../../project-models/train-model-dialog/advanced-settings/data-management/data-augmentation/data-augmentation.component';
import {
    TILING_MODES,
    TilingModeTooltip,
} from '../../../project-models/train-model-dialog/advanced-settings/data-management/tiling/tiling-modes.component';
import {
    getCustomTilingParameters,
    getTilingMode,
} from '../../../project-models/train-model-dialog/advanced-settings/data-management/tiling/utils';
import { Accordion } from '../../../project-models/train-model-dialog/advanced-settings/ui/accordion/accordion.component';
import { Parameters } from '../../../project-models/train-model-dialog/advanced-settings/ui/parameters.component';

interface ModelDataManagementParametersProps {
    parameters: TrainedModelConfiguration['datasetPreparation']['augmentation'];
}

const getAugmentationParameters = (parameters: TrainedModelConfiguration['datasetPreparation']['augmentation']) => {
    const augmentation = structuredClone(parameters);

    delete augmentation['tiling'];

    return augmentation;
};

interface TilingParametersProps {
    parameters: TrainedModelConfiguration['datasetPreparation']['augmentation']['tiling'];
}

interface TilingModeProps {
    tilingMode: string;
}

const TilingMode = ({ tilingMode }: TilingModeProps) => {
    return (
        <Flex width={'100%'} gap={'size-300'}>
            <View width={'size-3000'}>
                <Text>
                    Tiling mode <TilingModeTooltip />
                </Text>
            </View>
            <span aria-label={'Tiling mode'}>{tilingMode}</span>
        </Flex>
    );
};

const TilingParameters = ({ parameters }: TilingParametersProps) => {
    const tilingMode = getTilingMode(parameters);
    const customTilingParameters = getCustomTilingParameters(parameters);

    return (
        <Accordion>
            <Accordion.Title>
                Tiling <Accordion.Tag>{tilingMode}</Accordion.Tag>
            </Accordion.Title>
            <Accordion.Content>
                <Flex direction={'column'} gap={'size-300'}>
                    <TilingMode tilingMode={tilingMode} />
                    {tilingMode === TILING_MODES.CUSTOM && (
                        <Parameters parameters={customTilingParameters} onChange={noop} isReadOnly />
                    )}
                </Flex>
            </Accordion.Content>
        </Accordion>
    );
};

interface DataAugmentationParametersProps {
    parameters: TrainedModelConfiguration['datasetPreparation']['augmentation'];
}

const DataAugmentationParameters = ({ parameters }: DataAugmentationParametersProps) => {
    const isEnabled = isDataAugmentationEnabled(parameters);

    return (
        <Accordion>
            <Accordion.Title>
                Data augmentation
                <Accordion.Tag>{isEnabled ? 'Yes' : 'No'}</Accordion.Tag>
            </Accordion.Title>
            <Accordion.Content>
                <DataAugmentationParametersList
                    isReadOnly
                    parameters={parameters}
                    onUpdateTrainingConfiguration={noop}
                />
            </Accordion.Content>
        </Accordion>
    );
};

export const ModelDataManagementParameters = ({ parameters }: ModelDataManagementParametersProps) => {
    const tilingParameters = parameters.tiling;
    const augmentationParameters = getAugmentationParameters(parameters);

    return (
        <View>
            {!isEmpty(tilingParameters) && <TilingParameters parameters={tilingParameters} />}
            {!isEmpty(augmentationParameters) && <DataAugmentationParameters parameters={augmentationParameters} />}
        </View>
    );
};
