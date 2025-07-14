// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { forwardRef, useEffect, useRef } from 'react';

import { paths } from '@geti/core';
import { ActionButton, Tooltip, TooltipTrigger, type FocusableRef } from '@geti/ui';
import { CreditCard } from '@geti/ui/icons';
import { isNil } from 'lodash-es';
import { useParams } from 'react-router-dom';
import { useOverlayTriggerState } from 'react-stately';

import { useCreditsQueries } from '../../../../core/credits/hooks/use-credits-api.hook';
import { FUX_NOTIFICATION_KEYS, FUX_SETTINGS_KEYS } from '../../../../core/user-settings/dtos/user-settings.interface';
import { useUserGlobalSettings } from '../../../../core/user-settings/hooks/use-global-settings.hook';
import { useOrganizationIdentifier } from '../../../../hooks/use-organization-identifier/use-organization-identifier.hook';
import { usePrevious } from '../../../../hooks/use-previous/use-previous.hook';
import { useProject } from '../../../../pages/project-details/providers/project-provider/project-provider.component';
import { ONE_MINUTE } from '../../../utils';
import { FuxNotification } from '../../fux-notification/fux-notification.component';
import { useCheckPermission } from '../../has-permission/has-permission.component';
import { OPERATION } from '../../has-permission/has-permission.interface';
import { CreditsToConsume } from './credits-to-consume.component';
import { isBalanceLow } from './util';

import classes from './credit-balance.module.scss';

interface CreditBalanceButtonProps {
    isDarkMode: boolean;
    onPress?: () => void;
    UNSAFE_className?: string;
}

export const CreditBalanceButton = ({ isDarkMode }: { isDarkMode: boolean }) => {
    const params = useParams<{ projectId: string }>();

    if (isNil(params.projectId)) {
        return <CreditBalanceButtonDefault isDarkMode={isDarkMode} />;
    }

    return <CreditBalanceButtonFuxNotification isDarkMode={isDarkMode} />;
};

const CreditBalanceButtonDefault = forwardRef(
    ({ onPress, isDarkMode, UNSAFE_className }: CreditBalanceButtonProps, ref: FocusableRef<HTMLButtonElement>) => {
        const { useGetOrganizationBalanceQuery } = useCreditsQueries();
        const { organizationId } = useOrganizationIdentifier();
        const { data: organizationBalance } = useGetOrganizationBalanceQuery(
            { organizationId },
            { refetchInterval: ONE_MINUTE }
        );

        return (
            <TooltipTrigger placement={'bottom'}>
                <ActionButton
                    isQuiet
                    ref={ref}
                    width={15}
                    zIndex={1}
                    id={'credit-balance-button'}
                    aria-label={'credit balance status'}
                    onPress={onPress}
                    UNSAFE_className={UNSAFE_className}
                    colorVariant={isDarkMode ? 'dark' : 'light'}
                >
                    {organizationBalance && isBalanceLow(organizationBalance) && (
                        <div className={classes.cornerIndicator} aria-label={`low credit indicator`}></div>
                    )}

                    <CreditCard />
                </ActionButton>
                <Tooltip>Credit balance</Tooltip>
            </TooltipTrigger>
        );
    }
);

const CreditBalanceButtonFuxNotification = ({ isDarkMode }: { isDarkMode: boolean }) => {
    const triggerRef = useRef(null);
    const fuxState = useOverlayTriggerState({});
    const settings = useUserGlobalSettings();

    const isFuxNotificationEnabled = settings.config[FUX_NOTIFICATION_KEYS.AUTO_TRAINING_NOTIFICATION]?.isEnabled;
    const firstAutoTrainedProject = settings.config[FUX_SETTINGS_KEYS.FIRST_AUTOTRAINED_PROJECT_ID].value;
    const prevFuxEnabled = usePrevious(isFuxNotificationEnabled);

    const { organizationId } = useOrganizationIdentifier();
    const { project } = useProject();
    const isFirstAutoTrainedProject = firstAutoTrainedProject === project.id;
    const canCheckUsageTab = useCheckPermission([OPERATION.USAGE_TAB]);

    useEffect(() => {
        if (isFuxNotificationEnabled && prevFuxEnabled !== isFuxNotificationEnabled) {
            fuxState.open();
        } else if (!isFuxNotificationEnabled && prevFuxEnabled !== isFuxNotificationEnabled) {
            fuxState.close();
        }
    }, [fuxState, isFuxNotificationEnabled, prevFuxEnabled]);

    const handleCloseTrainingNotification = () => {
        isFuxNotificationEnabled &&
            settings.saveConfig({
                ...settings.config,
                [FUX_NOTIFICATION_KEYS.AUTO_TRAINING_MODAL]: { isEnabled: false },
                [FUX_NOTIFICATION_KEYS.AUTO_TRAINING_NOTIFICATION]: { isEnabled: false },
            });
    };

    return (
        <>
            <CreditBalanceButtonDefault
                ref={triggerRef}
                isDarkMode={isDarkMode}
                onPress={handleCloseTrainingNotification}
                UNSAFE_className={isFuxNotificationEnabled && isFirstAutoTrainedProject ? classes.fuxOpen : ''}
            />

            {isFirstAutoTrainedProject ? (
                <FuxNotification
                    settingsKey={FUX_NOTIFICATION_KEYS.CREDIT_BALANCE_BUTTON}
                    state={fuxState}
                    customDocUrl={canCheckUsageTab ? paths.account.usage({ organizationId }) : undefined}
                    triggerRef={triggerRef}
                    placement={'bottom right'}
                    onClose={handleCloseTrainingNotification}
                >
                    The auto-training job has been started, <CreditsToConsume /> credits deducted.
                    {canCheckUsageTab ? ' Check your credit balance here.' : null}
                </FuxNotification>
            ) : (
                <></>
            )}
        </>
    );
};
