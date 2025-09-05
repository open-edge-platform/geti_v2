// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useRef } from 'react';

import { toast } from '@geti/ui';
import { InfiniteData } from '@tanstack/react-query';

import { useGetScheduledJobs } from '../../../../core/jobs/hooks/use-jobs.hook';
import { JobsResponse } from '../../../../core/jobs/services/jobs-service.interface';
import { ProjectIdentifier } from '../../../../core/projects/core.interface';
import { UserGlobalSettings, UseSettings } from '../../../../core/user-settings/services/user-settings.interface';
import { useProject } from '../../../project-details/providers/project-provider/project-provider.component';
import { useIsAutoTrainingOn } from '../../hooks/use-is-auto-training-on.hook';
import { JOB_TRIGGER, onScheduledTrainingJobs } from '../utils';

interface AutoTrainingStartedNotificationProps {
    settings: UseSettings<UserGlobalSettings>;
}

const useAutoTrainingStartedNotificationJobs = ({
    enabled,
    projectIdentifier,
    onSuccess,
}: {
    enabled: boolean;
    projectIdentifier: ProjectIdentifier;
    onSuccess: (data: InfiniteData<JobsResponse>) => void;
}) => {
    const handleSuccessRef = useRef(onSuccess);

    const jobsQuery = useGetScheduledJobs({ projectId: projectIdentifier.projectId, queryOptions: { enabled } });

    useEffect(() => {
        handleSuccessRef.current = onSuccess;
    }, [onSuccess]);

    useEffect(() => {
        if (!enabled || !jobsQuery.isSuccess) {
            return;
        }

        handleSuccessRef.current(jobsQuery.data);
    }, [enabled, jobsQuery.isSuccess, jobsQuery.data]);
};

export const AutoTrainingStartedNotification = ({ settings }: AutoTrainingStartedNotificationProps) => {
    const openedNotification = useRef(new Set<string>());

    const { project, projectIdentifier } = useProject();
    const isAutoTrainingOn = useIsAutoTrainingOn({ project, projectIdentifier });

    const firstAutoTrainingJobId = settings.config.firstAutoTrainingJobId.value;
    const queryEnabled =
        isAutoTrainingOn &&
        !settings.config.neverAutotrained.value &&
        !settings.config.annotatorAutoTrainingStarted.isEnabled;

    useAutoTrainingStartedNotificationJobs({
        enabled: queryEnabled,
        projectIdentifier,
        onSuccess: onScheduledTrainingJobs((scheduledJob) => {
            if (
                !queryEnabled ||
                firstAutoTrainingJobId === scheduledJob.id ||
                openedNotification.current.has(scheduledJob.id)
            ) {
                return;
            }

            openedNotification.current.add(scheduledJob.id);
            toast({ message: `Auto-training round has been started.`, type: 'info' });
        }, JOB_TRIGGER.AUTO),
    });

    return <></>;
};
