// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useCallback, useEffect, useRef } from 'react';

import { useFeatureFlags } from '@geti/core/src/feature-flags/hooks/use-feature-flags.hook';
import { toast } from '@geti/ui';
import { InfiniteData } from '@tanstack/react-query';
import { isNil } from 'lodash-es';
import { useParams } from 'react-router-dom';

import { useGetScheduledJobs } from '../../../../core/jobs/hooks/use-jobs.hook';
import { JobsResponse } from '../../../../core/jobs/services/jobs-service.interface';
import { isJobTrain } from '../../../../core/jobs/utils';
import { useTotalCreditPrice } from '../../../project-details/hooks/use-credits-to-consume.hook';
import { useProject } from '../../../project-details/providers/project-provider/project-provider.component';
import { JOB_TRIGGER, onScheduledTrainingJobs } from '../utils';

export const ManualTrainingCreditDeductionNotificationFactory = () => {
    const params = useParams<{ projectId: string }>();
    const { FEATURE_FLAG_CREDIT_SYSTEM } = useFeatureFlags();
    // We only want to display this notification on components within the project context
    if (isNil(params.projectId) || !FEATURE_FLAG_CREDIT_SYSTEM) {
        return <></>;
    }

    return <ManualTrainingCreditDeductionNotification />;
};

const useManualTrainingCreditDeductionNotificationJobs = () => {
    const { projectIdentifier } = useProject();
    const openedNotification = useRef(new Set<string>());
    const { isLoading, getCreditPrice } = useTotalCreditPrice();
    const queryEnabled = !isLoading;

    const jobsQuery = useGetScheduledJobs({
        projectId: projectIdentifier.projectId,
        queryOptions: { enabled: queryEnabled },
    });

    const handleSuccess = useCallback(
        (jobs: InfiniteData<JobsResponse>) => {
            return onScheduledTrainingJobs((scheduledJob) => {
                if (!queryEnabled || openedNotification.current.has(scheduledJob.id)) {
                    return;
                }

                if (!isJobTrain(scheduledJob)) {
                    return;
                }

                const jobTask = scheduledJob;
                const { totalCreditsToConsume } = getCreditPrice(jobTask.metadata.task.taskId);

                openedNotification.current.add(scheduledJob.id);
                toast({
                    message: `The model training has been started, ${totalCreditsToConsume} credits deducted.`,
                    type: 'info',
                });
            }, JOB_TRIGGER.MANUAL)(jobs);
        },
        [getCreditPrice, queryEnabled]
    );

    useEffect(() => {
        if (!queryEnabled || !jobsQuery.isSuccess) {
            return;
        }

        handleSuccess(jobsQuery.data);
    }, [queryEnabled, jobsQuery.isSuccess, jobsQuery.data, handleSuccess]);
};

export const ManualTrainingCreditDeductionNotification = () => {
    useManualTrainingCreditDeductionNotificationJobs();

    return <></>;
};
