// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';

import { createGetiQueryClient } from '../../../providers/query-client-provider/query-client-provider.component';
import { getMockedWorkspaceIdentifier } from '../../../test-utils/mocked-items-factory/mocked-identifiers';
import { getMockedJob } from '../../../test-utils/mocked-items-factory/mocked-jobs';
import { renderHookWithProviders } from '../../../test-utils/render-hook-with-providers';
import { JobState } from '../jobs.const';
import { Job } from '../jobs.interface';
import { useInvalidateBalanceOnNewJob } from './utils';

const getMockedResponse = (jobs: Job[]) => ({
    pages: [
        {
            nextPage: '',
            jobs,
            jobsCount: {
                numberOfRunningJobs: jobs.length,
                numberOfFinishedJobs: 0,
                numberOfScheduledJobs: 0,
                numberOfCancelledJobs: 0,
                numberOfFailedJobs: 0,
            },
        },
    ],
    pageParams: [undefined],
});

const workspaceIdentifier = getMockedWorkspaceIdentifier({ workspaceId: 'workspaceId' });
const mockSetInvalidateQueries = jest.fn();

const queryClient = createGetiQueryClient({
    addNotification: jest.fn(),
});
queryClient.invalidateQueries = mockSetInvalidateQueries;

const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Use jobs hook utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Should not invalidate balance if feature flag is disabled', async () => {
        renderHookWithProviders(
            () => {
                return useInvalidateBalanceOnNewJob(
                    workspaceIdentifier,
                    getMockedResponse([getMockedJob({ cost: { leaseId: '123', requests: [], consumed: [] } })]),
                    { jobState: JobState.SCHEDULED }
                );
            },
            {
                wrapper,
                providerProps: { featureFlags: { FEATURE_FLAG_CREDIT_SYSTEM: false } },
            }
        );

        await waitFor(() => {
            expect(mockSetInvalidateQueries).not.toHaveBeenCalled();
        });
    });

    it('Should invalidate balance if feature flag is enabled', async () => {
        const { rerender } = renderHookWithProviders(
            ({ jobs }) => {
                return useInvalidateBalanceOnNewJob(workspaceIdentifier, getMockedResponse(jobs), {});
            },
            {
                wrapper,
                providerProps: { featureFlags: { FEATURE_FLAG_CREDIT_SYSTEM: true } },
                initialProps: {
                    jobs: [
                        getMockedJob({
                            state: JobState.SCHEDULED,
                            cost: { leaseId: '123', requests: [], consumed: [] },
                        }),
                    ],
                },
            }
        );

        rerender({
            jobs: [
                getMockedJob({
                    state: JobState.SCHEDULED,
                    cost: { leaseId: '123', requests: [], consumed: [] },
                }),
                getMockedJob({
                    state: JobState.CANCELLED,
                    cost: { leaseId: '123', requests: [], consumed: [] },
                }),
            ],
        });

        await waitFor(() => {
            expect(mockSetInvalidateQueries).toHaveBeenCalledTimes(2);
        });
    });

    it('Should not invalidate balance if there are no jobs', async () => {
        renderHookWithProviders(
            () =>
                useInvalidateBalanceOnNewJob(workspaceIdentifier, getMockedResponse([]), {
                    jobState: JobState.SCHEDULED,
                }),
            {
                wrapper,
                providerProps: { featureFlags: { FEATURE_FLAG_CREDIT_SYSTEM: true } },
            }
        );

        await waitFor(() => {
            expect(mockSetInvalidateQueries).not.toHaveBeenCalled();
        });
    });

    it('Should not invalidate balance if there are no jobs with cost', async () => {
        renderHookWithProviders(
            () =>
                useInvalidateBalanceOnNewJob(workspaceIdentifier, getMockedResponse([getMockedJob()]), {
                    jobState: JobState.SCHEDULED,
                }),
            {
                wrapper,
                providerProps: { featureFlags: { FEATURE_FLAG_CREDIT_SYSTEM: true } },
            }
        );

        await waitFor(() => {
            expect(mockSetInvalidateQueries).not.toHaveBeenCalled();
        });
    });

    it('Should invalidate balance if there is a job with new id or a new job', async () => {
        const { rerender } = renderHookWithProviders(
            ({ jobs }) => {
                return useInvalidateBalanceOnNewJob(workspaceIdentifier, getMockedResponse(jobs), {
                    jobState: JobState.SCHEDULED,
                });
            },
            {
                wrapper,
                providerProps: {
                    featureFlags: { FEATURE_FLAG_CREDIT_SYSTEM: true },
                },
                initialProps: {
                    jobs: [
                        getMockedJob({
                            state: JobState.SCHEDULED,
                            cost: { leaseId: '123', requests: [], consumed: [] },
                        }),
                    ],
                },
            }
        );

        await waitFor(() => {
            expect(mockSetInvalidateQueries).toHaveBeenCalledTimes(1);
        });

        rerender({
            jobs: [
                getMockedJob({
                    id: 'newId',
                    state: JobState.SCHEDULED,
                    cost: { leaseId: '123', requests: [], consumed: [] },
                }),
            ],
        });

        await waitFor(() => {
            expect(mockSetInvalidateQueries).toHaveBeenCalledTimes(2);
        });

        rerender({
            jobs: [
                getMockedJob({
                    id: 'newId',
                    state: JobState.SCHEDULED,
                    cost: { leaseId: '123', requests: [], consumed: [] },
                }),
                getMockedJob({ state: JobState.SCHEDULED, cost: { leaseId: '123', requests: [], consumed: [] } }),
            ],
        });

        await waitFor(() => {
            expect(mockSetInvalidateQueries).toHaveBeenCalledTimes(3);
        });
    });
});
