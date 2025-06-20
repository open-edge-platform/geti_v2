// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { waitFor } from '@testing-library/react';

import { ExportStatusStateDTO } from '../../../core/configurable-parameters/dtos/configurable-parameters.interface';
import { JobState } from '../../../core/jobs/jobs.const';
import { ExportDatasetStatusIdentifier, ExportFormats } from '../../../core/projects/dataset.interface';
import { createInMemoryProjectService } from '../../../core/projects/services/in-memory-project-service';
import { ProjectService } from '../../../core/projects/services/project-service.interface';
import { NOTIFICATION_TYPE } from '../../../notification/notification-toast/notification-type.enum';
import { getMockedDatasetExportIdentifier } from '../../../test-utils/mocked-items-factory/mocked-identifiers';
import { getMockedDatasetExportJob } from '../../../test-utils/mocked-items-factory/mocked-jobs';
import { renderHookWithProviders } from '../../../test-utils/render-hook-with-providers';
import { useExportDataset } from './use-export-dataset.hook';

const organizationId = 'organization-id';
const mockExportDatasetId = '241';
const mockExportDatasetStatusIdentifier: ExportDatasetStatusIdentifier = getMockedDatasetExportIdentifier({
    datasetId: '123',
    workspaceId: '321',
    projectId: '4455',
    exportDatasetId: mockExportDatasetId,
});

const mockAddLsExportDataset = jest.fn();
jest.mock('./use-local-storage-export-dataset.hook', () => ({
    ...jest.requireActual('./use-local-storage-export-dataset.hook'),
    useLocalStorageExportDataset: () => ({
        addLsExportDataset: mockAddLsExportDataset,
    }),
}));

const mockAddNotification = jest.fn();
const mockRemoveNotifications = jest.fn();

jest.mock('../../../notification/notification.component', () => ({
    ...jest.requireActual('../../../notification/notification.component'),
    useNotification: () => ({ addNotification: mockAddNotification, removeNotifications: mockRemoveNotifications }),
}));

const datasetName = 'testDatasetName';

const renderUseExportDatasetHook = (projectService: ProjectService) => {
    return renderHookWithProviders(() => useExportDataset(datasetName), {
        providerProps: {
            projectService,
        },
    });
};

describe('useExportDataset', () => {
    const errorMessage = 'test message';

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('prepareExportDatasetJob', () => {
        it('save info in local storage', async () => {
            const mockedProjectService = createInMemoryProjectService();
            mockedProjectService.prepareExportDatasetJob = async () => ({ jobId: mockExportDatasetId });

            const { result } = renderUseExportDatasetHook(mockedProjectService);

            result.current.prepareExportDatasetJob.mutate({
                ...mockExportDatasetStatusIdentifier,
                exportFormat: ExportFormats.YOLO,
                saveVideoAsImages: true,
            });

            await waitFor(() => {
                expect(mockAddLsExportDataset).toHaveBeenCalledWith({
                    datasetName,
                    datasetId: mockExportDatasetStatusIdentifier.datasetId,
                    isPrepareDone: false,
                    exportFormat: ExportFormats.YOLO,
                    exportDatasetId: mockExportDatasetId,
                });
            });

            expect(mockRemoveNotifications).toHaveBeenCalled();
        });

        it('shows notification error message', async () => {
            const mockedProjectService = createInMemoryProjectService();

            mockedProjectService.prepareExportDatasetJob = () => Promise.reject({ message: errorMessage });

            const { result } = renderUseExportDatasetHook(mockedProjectService);

            result.current.prepareExportDatasetJob.mutate({
                ...mockExportDatasetStatusIdentifier,
                exportFormat: ExportFormats.YOLO,
                saveVideoAsImages: true,
            });

            await waitFor(() => {
                expect(mockAddNotification).toHaveBeenCalledWith({
                    message: errorMessage,
                    type: NOTIFICATION_TYPE.ERROR,
                });
            });
        });
    });

    describe('exportDatasetStatus', () => {
        it('export is not "DONE", do not show notifications', async () => {
            const mockedProjectService = createInMemoryProjectService();
            mockedProjectService.exportDatasetStatus = async () => ({
                state: ExportStatusStateDTO.ZIPPING,
                message: '',
                progress: -1,
                download_url: '',
            });

            const { result } = renderUseExportDatasetHook(mockedProjectService);
            const { workspaceId, projectId, datasetId } = mockExportDatasetStatusIdentifier;

            result.current.exportDatasetStatus.mutate({
                organizationId,
                workspaceId,
                projectId,
                datasetId,
                exportDatasetId: mockExportDatasetId,
            });

            await waitFor(() => {
                expect(result.current.exportDatasetStatus.status).toBe('success');
                expect(mockAddNotification).not.toBeCalled();
            });
        });

        it('show notifications', async () => {
            const mockedProjectService = createInMemoryProjectService();
            mockedProjectService.exportDatasetStatus = async () => ({
                state: ExportStatusStateDTO.DONE,
                message: '',
                progress: -1,
                download_url: '',
            });

            const { result } = renderUseExportDatasetHook(mockedProjectService);
            const { workspaceId, projectId, datasetId } = mockExportDatasetStatusIdentifier;

            result.current.exportDatasetStatus.mutate({
                organizationId,
                workspaceId,
                projectId,
                datasetId,
                exportDatasetId: mockExportDatasetId,
            });

            await waitFor(() => {
                expect(mockAddNotification).toHaveBeenCalledWith({
                    message: expect.any(String),
                    type: NOTIFICATION_TYPE.INFO,
                });
            });
        });

        it('shows notification error message', async () => {
            const mockedProjectService = createInMemoryProjectService();
            mockedProjectService.exportDatasetStatus = () => Promise.reject({ message: errorMessage });

            const { result } = renderUseExportDatasetHook(mockedProjectService);
            const { workspaceId, projectId, datasetId } = mockExportDatasetStatusIdentifier;

            result.current.exportDatasetStatus.mutate({
                organizationId,
                workspaceId,
                projectId,
                datasetId,
                exportDatasetId: mockExportDatasetId,
            });

            await waitFor(() => {
                expect(mockAddNotification).toHaveBeenCalledWith({
                    message: errorMessage,
                    type: NOTIFICATION_TYPE.ERROR,
                });
            });
        });

        it('successful request with error state shows notification error message', async () => {
            const mockedProjectService = createInMemoryProjectService();
            mockedProjectService.exportDatasetStatus = async () => ({
                state: ExportStatusStateDTO.ERROR,
                message: errorMessage,
                progress: -1,
                download_url: '',
            });

            const { result } = renderUseExportDatasetHook(mockedProjectService);
            const exportDatasetStatusIdentifier = mockExportDatasetStatusIdentifier;

            result.current.exportDatasetStatus.mutate({
                ...exportDatasetStatusIdentifier,
                exportDatasetId: mockExportDatasetId,
            });

            await waitFor(() => {
                expect(mockAddNotification).toHaveBeenCalledWith({
                    message: errorMessage,
                    type: NOTIFICATION_TYPE.ERROR,
                });
            });
        });
    });

    it('useExportDatasetStatusJob', async () => {
        const mockedOnSuccess = jest.fn();

        const jobResponse = getMockedDatasetExportJob({
            state: JobState.FINISHED,
            metadata: { downloadUrl: 'downloadUrl-test', project: { id: 'some-id', name: 'some-name' } },
        });

        const mockedProjectService = createInMemoryProjectService();
        mockedProjectService.exportDatasetStatusJob = async () => jobResponse;

        const { result } = renderUseExportDatasetHook(mockedProjectService);
        const { workspaceId } = mockExportDatasetStatusIdentifier;

        const mockedData = { jobId: '2313', workspaceId, organizationId };

        renderHookWithProviders(() =>
            result.current.useExportDatasetStatusJob({
                enabled: true,
                data: mockedData,
                onSuccess: mockedOnSuccess,
            })
        );

        await waitFor(() => {
            expect(mockedOnSuccess).toHaveBeenCalledWith(jobResponse);
        });
    });
});
