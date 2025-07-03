// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC, ReactNode } from 'react';

import { Grid, minmax, Text, View } from '@geti/ui';

import {
    ConfigurationParameter,
    TrainingConfiguration,
} from '../../../../../../../../core/configurable-parameters/services/configuration.interface';
import { isBoolParameter } from '../../../../../../../../core/configurable-parameters/utils';
import { Accordion } from '../../ui/accordion/accordion.component';
import { Parameters } from '../../ui/parameters.component';
import { TILING_MODES, TilingModes } from './tiling-modes.component';

import styles from './tiling.module.scss';

interface TilingProps {
    tilingParameters: ConfigurationParameter[];
    onUpdateTrainingConfiguration: (
        updateFunction: (config: TrainingConfiguration | undefined) => TrainingConfiguration | undefined
    ) => void;
}

const ADAPTIVE_TILING_PARAMETER = 'adaptive_tiling';
const ENABLE_TILING_PARAMETER = 'enable';

const getAdaptiveTilingParameter = (tilingParameters: ConfigurationParameter[]) => {
    const parameter = tilingParameters.find(({ key }) => key === ADAPTIVE_TILING_PARAMETER);

    if (parameter === undefined || !isBoolParameter(parameter)) {
        return undefined;
    }

    return parameter;
};

const getEnableTilingParameter = (tilingParameters: ConfigurationParameter[]) => {
    const parameter = tilingParameters.find(({ key }) => key === ENABLE_TILING_PARAMETER);

    if (parameter === undefined || !isBoolParameter(parameter)) {
        return undefined;
    }

    return parameter;
};

export const getTilingMode = (tilingParameters: ConfigurationParameter[]): TILING_MODES => {
    const adaptive = getAdaptiveTilingParameter(tilingParameters);
    const enablingTiling = getEnableTilingParameter(tilingParameters);

    if (enablingTiling?.value === false) {
        return TILING_MODES.OFF;
    }

    if (adaptive?.value === true) {
        return TILING_MODES.AUTOMATIC;
    }

    return TILING_MODES.CUSTOM;
};

export const getCustomTilingParameters = (parameters: ConfigurationParameter[]) => {
    return parameters.filter(
        (parameter) => ![ADAPTIVE_TILING_PARAMETER, ENABLE_TILING_PARAMETER].includes(parameter.key)
    );
};

export const Tiling: FC<TilingProps> = ({ tilingParameters, onUpdateTrainingConfiguration }) => {
    const selectedTilingMode = getTilingMode(tilingParameters);

    const customTilingParameters = getCustomTilingParameters(tilingParameters);

    const handleUpdateTilingParameter = (inputParameter: ConfigurationParameter | ConfigurationParameter[]) => {
        onUpdateTrainingConfiguration((config) => {
            if (config === undefined) return;

            const updatedTilingParameters = tilingParameters.map((parameter) => {
                if (Array.isArray(inputParameter)) {
                    const parameterToUpdate = inputParameter.find((p) => p.key === parameter.key);

                    return parameterToUpdate ?? parameter;
                }

                return parameter.key === inputParameter.key ? inputParameter : parameter;
            });

            return {
                ...config,
                datasetPreparation: {
                    ...config.datasetPreparation,
                    augmentation: {
                        ...config.datasetPreparation.augmentation,
                        tiling: updatedTilingParameters,
                    },
                },
            };
        });
    };

    const handleTilingModeChange = (tilingMode: TILING_MODES) => {
        const adaptiveParameter = getAdaptiveTilingParameter(tilingParameters);
        const enableParameter = getEnableTilingParameter(tilingParameters);

        if (adaptiveParameter === undefined || enableParameter === undefined) {
            return;
        }

        if (tilingMode === TILING_MODES.AUTOMATIC) {
            handleUpdateTilingParameter([
                { ...enableParameter, value: true },
                { ...adaptiveParameter, value: true },
            ]);
        } else if (tilingMode === TILING_MODES.OFF) {
            handleUpdateTilingParameter([
                { ...enableParameter, value: false },
                { ...adaptiveParameter, value: false },
            ]);
        } else {
            handleUpdateTilingParameter([
                { ...enableParameter, value: true },
                { ...adaptiveParameter, value: false },
            ]);
        }
    };

    const TILING_MODE_COMPONENTS: Record<TILING_MODES, ReactNode> = {
        [TILING_MODES.OFF]: (
            <Text UNSAFE_className={styles.tilingModeDescription} gridColumn={'2/3'}>
                Model processes the entire image as a single unit without dividing it into smaller tiles. This approach
                is straightforward but may struggle with detecting small objects in high-resolution images, as the model
                might miss finer details
            </Text>
        ),

        [TILING_MODES.AUTOMATIC]: (
            <View UNSAFE_className={styles.tilingModeDescription} gridColumn={'2/3'}>
                It means that the system will automatically set the parameters based on the images resolution and
                annotations size.
            </View>
        ),
        [TILING_MODES.CUSTOM]: (
            <View gridColumn={'1/-1'}>
                <Parameters parameters={customTilingParameters} onChange={handleUpdateTilingParameter} />
            </View>
        ),
    };

    return (
        <Accordion>
            <Accordion.Title>
                Tiling<Accordion.Tag>{selectedTilingMode}</Accordion.Tag>
            </Accordion.Title>
            <Accordion.Content>
                <Accordion.Description>
                    Tiling is a technique that divides high-resolution images into smaller tiles and might be useful to
                    increase accuracy for small object detection tasks.
                </Accordion.Description>
                <Accordion.Divider marginY={'size-250'} />
                <Grid
                    columns={['size-3000', minmax('size-3400', '1fr'), 'size-400']}
                    gap={'size-300'}
                    alignItems={'center'}
                >
                    <TilingModes selectedTilingMode={selectedTilingMode} onTilingModeChange={handleTilingModeChange} />
                    {TILING_MODE_COMPONENTS[selectedTilingMode]}
                </Grid>
            </Accordion.Content>
        </Accordion>
    );
};
