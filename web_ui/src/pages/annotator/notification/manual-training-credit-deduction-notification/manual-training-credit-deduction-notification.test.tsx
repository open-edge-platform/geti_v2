// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';

import { GETI_SYSTEM_AUTHOR_ID, JobState } from '../../../../core/jobs/jobs.const';
import { Job, JobCount } from '../../../../core/jobs/jobs.interface';
import { createInMemoryJobsService } from '../../../../core/jobs/services/in-memory-jobs-service';
import { getMockedJob, getMockedJobCount } from '../../../../test-utils/mocked-items-factory/mocked-jobs';
import { providersRender } from '../../../../test-utils/required-providers-render';
import { ProjectProvider } from '../../../project-details/providers/project-provider/project-provider.component';
import { ManualTrainingCreditDeductionNotification } from './manual-training-credit-deduction-notification.component';

const mockedToast = jest.fn();
jest.mock('@geti/ui', () => ({
    ...jest.requireActual('@geti/ui'),
    toast: (params: unknown) => mockedToast(params),
}));

const mockedProjectIdentifier = {
    projectId: 'project-id',
    workspaceId: 'workspace-id',
    organizationId: 'organization-id',
};

describe('ManualTrainingCreditDeductionNotification', () => {
    const renderApp = async ({
        jobCount = {},
        isFlagOn = true,
        mockedJob = undefined,
    }: {
        isFlagOn?: boolean;
        jobCount?: Partial<JobCount>;
        mockedJob?: Job;
    }) => {
        const jobsService = createInMemoryJobsService();

        jobsService.getJobs = async () => ({
            jobs: [mockedJob ?? getMockedJob({ state: JobState.SCHEDULED })],
            jobsCount: getMockedJobCount(jobCount),
            nextPage: '',
        });

        providersRender(
            <ProjectProvider projectIdentifier={mockedProjectIdentifier}>
                <ManualTrainingCreditDeductionNotification />
            </ProjectProvider>,
            {
                services: { jobsService },
                featureFlags: { FEATURE_FLAG_CREDIT_SYSTEM: isFlagOn },
            }
        );

        await waitForElementToBeRemoved(screen.getByRole('progressbar'));
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('check that notification is opened only once and with right content', async () => {
        await renderApp({
            jobCount: { numberOfScheduledJobs: 1 },
        });

        await waitFor(() => {
            expect(mockedToast).toHaveBeenNthCalledWith(1, {
                message: 'The model training has been started, 7 credits deducted.',
                type: 'info',
            });
        });
    });

    it('check that notification will not appear when number of scheduled jobs is 0', async () => {
        await renderApp({
            jobCount: { numberOfScheduledJobs: 0 },
        });

        expect(mockedToast).not.toHaveBeenCalled();
    });

    it('check that notification will not appear if the scheduled job was triggered by autotraining', async () => {
        await renderApp({
            jobCount: { numberOfScheduledJobs: 0 },
            mockedJob: getMockedJob({ state: JobState.SCHEDULED, authorId: GETI_SYSTEM_AUTHOR_ID }),
        });

        expect(mockedToast).not.toHaveBeenCalled();
    });

    it(`check that notification won't appear if credit system feature flag is disabled`, async () => {
        await renderApp({
            jobCount: { numberOfScheduledJobs: 1 },
            isFlagOn: false,
        });

        await waitFor(() => {
            expect(mockedToast).not.toHaveBeenCalled();
        });
    });
});
