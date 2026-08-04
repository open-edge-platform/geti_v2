// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { MutableRefObject, useEffect } from 'react';

import { OverlayTriggerState } from 'react-stately';

import { FUX_NOTIFICATION_KEYS } from '../../../../core/user-settings/dtos/user-settings.interface';
import { useUserGlobalSettings } from '../../../../core/user-settings/hooks/use-global-settings.hook';
import { usePrevious } from '../../../../hooks/use-previous/use-previous.hook';
import { FuxNotification } from '../fux-notification.component';

interface AnnotateInteractivelyNotificationProps {
    triggerRef: MutableRefObject<null>;
    state: OverlayTriggerState;
}

export const AnnotateInteractivelyNotification = ({ triggerRef, state }: AnnotateInteractivelyNotificationProps) => {
    const settings = useUserGlobalSettings();
    const isFuxNotificationEnabled = settings.config[FUX_NOTIFICATION_KEYS.ANNOTATE_INTERACTIVELY]?.isEnabled;
    const prevFuxEnabled = usePrevious(isFuxNotificationEnabled);

    useEffect(() => {
        if (isFuxNotificationEnabled && prevFuxEnabled !== isFuxNotificationEnabled) {
            state.open();
        } else if (!isFuxNotificationEnabled && prevFuxEnabled !== isFuxNotificationEnabled) {
            state.close();
        }
    }, [state, isFuxNotificationEnabled, prevFuxEnabled]);

    const handleCloseNotification = () => {
        isFuxNotificationEnabled &&
            settings.saveConfig({
                ...settings.config,
                [FUX_NOTIFICATION_KEYS.ANNOTATE_INTERACTIVELY]: { isEnabled: false },
            });
    };

    return (
        <FuxNotification
            settingsKey={FUX_NOTIFICATION_KEYS.ANNOTATE_INTERACTIVELY}
            placement='top right'
            triggerRef={triggerRef}
            state={state}
            onClose={handleCloseNotification}
        />
    );
};
