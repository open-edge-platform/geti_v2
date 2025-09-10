// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ButtonGroup } from '@geti/ui';
import { AICPUIcon, Human } from '@geti/ui/icons';
import { useSearchParams } from 'react-router-dom';

import { useFuxNotifications } from '../../../../hooks/use-fux-notifications/use-fux-notifications.hook';
import { ButtonWithSpectrumTooltip } from '../../../../shared/components/button-with-tooltip/button-with-tooltip.component';
import { runWhen } from '../../../../shared/utils';
import { ANNOTATOR_MODE } from '../../core/annotation-tool-context.interface';
import { useAnnotatorMode } from '../../hooks/use-annotator-mode';
import {
    useExplanationOpacity,
    usePrediction,
} from '../../providers/prediction-provider/prediction-provider.component';
import { useSelectedMediaItem } from '../../providers/selected-media-item-provider/selected-media-item-provider.component';
import { useTask } from '../../providers/task-provider/task-provider.component';

import classes from './navigation-toolbar.module.scss';

const isPredictionMode = (mode: ANNOTATOR_MODE) => mode === ANNOTATOR_MODE.PREDICTION;

export const AnnotationPredictionToggle = () => {
    const { isTaskChainSecondTask } = useTask();
    const { handleFirstVisitToPredictionMode } = useFuxNotifications();

    const { currentMode } = useAnnotatorMode();
    const [searchParams, setSearchParams] = useSearchParams();
    const { setShowOverlapAnnotations } = useExplanationOpacity();
    const { setExplanationVisible, predictionsRoiQuery } = usePrediction();
    const { selectedMediaItemQuery } = useSelectedMediaItem();

    const updateNewMode = runWhen((newMode: ANNOTATOR_MODE) => currentMode !== newMode);

    const { selectedMediaItem } = useSelectedMediaItem();
    const handleChangeMode = updateNewMode(async (newMode: ANNOTATOR_MODE) => {
        const isNewPredictionMode = isPredictionMode(newMode);
        searchParams.set('mode', newMode);

        setSearchParams(searchParams);
        setExplanationVisible(false);
        setShowOverlapAnnotations(false);

        if (isNewPredictionMode && selectedMediaItem !== undefined) {
            if (isTaskChainSecondTask) {
                await predictionsRoiQuery.refetch();
                selectedMediaItemQuery.refetch();
            }
        }
    });

    return (
        <ButtonGroup>
            <ButtonWithSpectrumTooltip
                margin={0}
                id='select-annotation-mode'
                tooltip={'Active learning'}
                aria-label='Select annotation mode'
                onPress={() => handleChangeMode(ANNOTATOR_MODE.ACTIVE_LEARNING)}
                UNSAFE_className={[classes.toggleMode, !isPredictionMode(currentMode) ? 'is-selected' : ''].join(' ')}
            >
                <Human />
            </ButtonWithSpectrumTooltip>
            <ButtonWithSpectrumTooltip
                margin={0}
                id='select-prediction-mode'
                tooltip={'AI prediction'}
                aria-label='Select prediction mode'
                onPress={() => {
                    handleChangeMode(ANNOTATOR_MODE.PREDICTION);
                    handleFirstVisitToPredictionMode();
                }}
                UNSAFE_className={[classes.toggleMode, isPredictionMode(currentMode) ? 'is-selected' : ''].join(' ')}
            >
                <AICPUIcon />
            </ButtonWithSpectrumTooltip>
        </ButtonGroup>
    );
};
