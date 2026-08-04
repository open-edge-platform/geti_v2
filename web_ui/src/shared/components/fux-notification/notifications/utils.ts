// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { InfiniteData } from '@tanstack/react-query';

import { GETI_SYSTEM_AUTHOR_ID, JobState } from '../../../../core/jobs/jobs.const';
import { JobTask } from '../../../../core/jobs/jobs.interface';
import { JobsResponse } from '../../../../core/jobs/services/jobs-service.interface';
import { FUX_SETTINGS_KEYS } from '../../../../core/user-settings/dtos/user-settings.interface';
import { UserGlobalSettings, UseSettings } from '../../../../core/user-settings/services/user-settings.interface';

export const onFirstSuccessfulAutoTrainingJob =
    (settings: UseSettings<UserGlobalSettings>, callback: (modelId: string) => void) =>
    ({ pages }: InfiniteData<JobsResponse>) => {
        if (!pages[0]) {
            return;
        }

        const { jobsCount, jobs } = pages[0];
        const totalFinishedJobs = Number(jobsCount.numberOfFinishedJobs);
        const hasFinishedJobs = totalFinishedJobs > 0;
        const neverSuccessfullyAutoTrained = settings.config[FUX_SETTINGS_KEYS.NEVER_SUCCESSFULLY_AUTOTRAINED].value;
        const firstScheduledAutoTrainingJobId = settings.config[FUX_SETTINGS_KEYS.FIRST_AUTOTRAINING_JOB_ID].value;
        const desiredJob = jobs.find((job): job is JobTask => {
            return (
                job.state === JobState.FINISHED &&
                job.authorId === GETI_SYSTEM_AUTHOR_ID &&
                job.id === firstScheduledAutoTrainingJobId
            );
        });
        const trainedModelId = desiredJob?.metadata?.trainedModel?.modelId;

        if (trainedModelId === undefined) {
            return;
        }

        if (trainedModelId && hasFinishedJobs && neverSuccessfullyAutoTrained && desiredJob) {
            callback(trainedModelId);
        }
    };
