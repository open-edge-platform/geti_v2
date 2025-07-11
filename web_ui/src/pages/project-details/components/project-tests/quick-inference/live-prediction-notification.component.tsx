// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ActionButton, Flex } from '@geti/ui';
import { Close, Info } from '@geti/ui/icons';

import { TUTORIAL_CARD_KEYS } from '../../../../../core/user-settings/dtos/user-settings.interface';
import { UserGlobalSettings, UseSettings } from '../../../../../core/user-settings/services/user-settings.interface';
import { dismissTutorial } from '../../../../../shared/components/tutorials/utils';
import { LiveInferenceMode } from './quick-inference-interfaces';

import classes from './quick-inference.module.scss';

interface LivePredictionNotificationProps {
    settings: UseSettings<UserGlobalSettings>;
    inferenceMode: LiveInferenceMode;
}

export const LivePredictionNotification = ({
    settings,
    inferenceMode,
}: LivePredictionNotificationProps): JSX.Element => {
    const handleDismissTutorial = async () => {
        await dismissTutorial(TUTORIAL_CARD_KEYS.LIVE_PREDICTION_NOTIFICATION, settings);
    };

    const description =
        inferenceMode === 'Use file'
            ? 'Upload an image to test with your active model right away.'
            : 'Use your camera to test your active model right away.';

    return (
        <Flex
            maxWidth={'57rem'}
            alignItems={'center'}
            justifyContent={'space-between'}
            UNSAFE_className={classes.livePredictionNotification}
            gap={'size-100'}
        >
            <Flex alignItems={'start'}>
                <div>
                    <Info
                        className={classes.infoIcon}
                        style={{ marginRight: 'var(--spectrum-global-dimension-size-100)' }}
                    />
                </div>
                <Flex wrap={'wrap'}>{description}</Flex>
            </Flex>
            <ActionButton isQuiet onPress={handleDismissTutorial} isDisabled={settings.isSavingConfig}>
                <Close />
            </ActionButton>
        </Flex>
    );
};
