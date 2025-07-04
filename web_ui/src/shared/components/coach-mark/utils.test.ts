// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { GETI_SYSTEM_AUTHOR_ID, JobState } from '../../../core/jobs/jobs.const';
import { Job, JobCount } from '../../../core/jobs/jobs.interface';
import { FUX_SETTINGS_KEYS } from '../../../core/user-settings/dtos/user-settings.interface';
import { getMockedJob } from '../../../test-utils/mocked-items-factory/mocked-jobs';
import {
    getMockedUserGlobalSettings,
    getMockedUserGlobalSettingsObject,
} from '../../../test-utils/mocked-items-factory/mocked-settings';
import { onFirstSuccessfulAutoTrainingJob } from './utils';

const getJobResponse = (jobCount: Partial<JobCount> = {}, mockedJobs: Job[] = []) => ({
    pageParams: [undefined],
    pages: [
        {
            jobs: mockedJobs,
            nextPage: undefined,
            jobsCount: {
                numberOfRunningJobs: 0,
                numberOfFinishedJobs: 0,
                numberOfScheduledJobs: 0,
                numberOfCancelledJobs: 0,
                numberOfFailedJobs: 0,
                ...jobCount,
            },
        },
    ],
});

describe('CoachMark utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('onFirstSuccessfulAutoTrainingJob', () => {
        const mockedCallback = jest.fn();

        it('will not call callback when invalid response', () => {
            onFirstSuccessfulAutoTrainingJob(
                getMockedUserGlobalSettingsObject({}),
                mockedCallback
            )({ pageParams: [undefined], pages: [] });
            expect(mockedCallback).toHaveBeenCalledTimes(0);
        });

        it('will not call callback when no finished jobs', () => {
            onFirstSuccessfulAutoTrainingJob(getMockedUserGlobalSettingsObject({}), mockedCallback)(getJobResponse());
            expect(mockedCallback).toHaveBeenCalledTimes(0);
        });

        it('will not call callback when previously autotrained', () => {
            onFirstSuccessfulAutoTrainingJob(
                getMockedUserGlobalSettingsObject({
                    config: getMockedUserGlobalSettings({
                        [FUX_SETTINGS_KEYS.NEVER_SUCCESSFULLY_AUTOTRAINED]: {
                            value: false,
                        },
                    }),
                }),
                mockedCallback
            )(getJobResponse());
            expect(mockedCallback).toHaveBeenCalledTimes(0);
        });

        it('will not call callback when first scheduled autotraining job id doesnt match finished job id', () => {
            onFirstSuccessfulAutoTrainingJob(
                getMockedUserGlobalSettingsObject({
                    config: getMockedUserGlobalSettings({
                        [FUX_SETTINGS_KEYS.FIRST_AUTOTRAINING_JOB_ID]: {
                            value: 'random-job-id',
                        },
                    }),
                }),
                mockedCallback
            )(getJobResponse());
            expect(mockedCallback).toHaveBeenCalledTimes(0);
        });

        it('will not call callback when first scheduled job id was not autotrained', () => {
            onFirstSuccessfulAutoTrainingJob(
                getMockedUserGlobalSettingsObject({
                    config: getMockedUserGlobalSettings({
                        [FUX_SETTINGS_KEYS.FIRST_AUTOTRAINING_JOB_ID]: {
                            value: 'first-autotrained-job-id',
                        },
                    }),
                }),
                mockedCallback
            )(
                getJobResponse({ numberOfFinishedJobs: 1 }, [
                    getMockedJob({
                        id: 'first-autotrained-job-id',
                        state: JobState.FINISHED,
                        authorId: 'Kasia',
                    }),
                ])
            );

            expect(mockedCallback).toHaveBeenCalledTimes(0);
        });

        it('will call callback ', () => {
            onFirstSuccessfulAutoTrainingJob(
                getMockedUserGlobalSettingsObject({
                    config: getMockedUserGlobalSettings({
                        [FUX_SETTINGS_KEYS.NEVER_SUCCESSFULLY_AUTOTRAINED]: {
                            value: true,
                        },
                        [FUX_SETTINGS_KEYS.FIRST_AUTOTRAINING_JOB_ID]: {
                            value: 'first-autotrained-job-id',
                        },
                    }),
                }),
                mockedCallback
            )(
                getJobResponse({ numberOfFinishedJobs: 1 }, [
                    getMockedJob({
                        id: 'first-autotrained-job-id',
                        state: JobState.FINISHED,
                        authorId: GETI_SYSTEM_AUTHOR_ID,
                    }),
                ])
            );

            expect(mockedCallback).toHaveBeenCalledTimes(1);
        });
    });
});
