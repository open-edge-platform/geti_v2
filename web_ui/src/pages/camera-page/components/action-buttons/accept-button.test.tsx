// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { fireEvent, screen, waitFor } from '@testing-library/react';

import { MediaUploadPerDataset } from '../../../../providers/media-upload-provider/media-upload.interface';
import { getMockedScreenshot } from '../../../../test-utils/mocked-items-factory/mocked-camera';
import { getMockedDatasetIdentifier } from '../../../../test-utils/mocked-items-factory/mocked-identifiers';
import { mockedMediaUploadPerDataset } from '../../../../test-utils/mocked-items-factory/mocked-upload-items';
import { providersRender as render } from '../../../../test-utils/required-providers-render';
import { checkTooltip } from '../../../../test-utils/utils';
import { Screenshot } from '../../../camera-support/camera.interface';
import { useDatasetMediaUpload } from '../../../project-details/components/project-dataset/hooks/dataset-media-upload';
import { ProjectProvider } from '../../../project-details/providers/project-provider/project-provider.component';
import { useCameraParams } from '../../hooks/camera-params.hook';
import { getUseCameraParams } from '../../test-utils/camera-params';
import { configUseCameraStorage } from '../../test-utils/config-use-camera';
import { AcceptButton, insufficientStorageMessage } from './accept-button.component';

jest.mock('../../hooks/camera-params.hook', () => ({
    ...jest.requireActual('../../hooks/camera-params.hook'),
    useCameraParams: jest.fn(),
}));

jest.mock('../../../project-details/components/project-dataset/hooks/dataset-media-upload', () => ({
    ...jest.requireActual('../../../project-details/components/project-dataset/hooks/dataset-media-upload'),
    useDatasetMediaUpload: jest.fn(() => ({
        mediaUploadState: { insufficientStorage: false },
        onUploadMedia: jest.fn(),
    })),
}));

const mockedScreenshot = getMockedScreenshot({});
const mockedDatasetIdentifier = getMockedDatasetIdentifier();

const mockedDatasetMediaUpload = (mediaUploadPerDataset: Partial<MediaUploadPerDataset>) => ({
    mediaUploadState: {
        ...mockedMediaUploadPerDataset,
        ...mediaUploadPerDataset,
    },
    onUploadMedia: jest.fn(),
    dispatch: jest.fn(),
    abort: jest.fn(),
    reset: jest.fn(),
    retry: jest.fn(),
});

describe('AcceptButton', () => {
    const renderApp = async ({
        filesData,
        deleteMany = jest.fn(),
        updateMany = jest.fn().mockResolvedValue(''),
        deleteAllItems = jest.fn().mockResolvedValue(''),
        navigate = jest.fn(),
        insufficientStorage = false,
    }: {
        navigate?: jest.Mock;
        filesData?: Screenshot[];
        isLivePrediction?: boolean;
        updateMany?: jest.Mock;
        deleteMany?: jest.Mock;
        deleteAllItems?: jest.Mock;
        mockedGetBrowserPermissions?: jest.Mock;
        insufficientStorage?: boolean;
    }) => {
        jest.mocked(useCameraParams).mockReturnValue(getUseCameraParams({ ...mockedDatasetIdentifier }));
        jest.mocked(useDatasetMediaUpload).mockReturnValue(mockedDatasetMediaUpload({ insufficientStorage }));

        configUseCameraStorage({ deleteAllItems, updateMany, deleteMany, filesData });

        render(
            <ProjectProvider
                projectIdentifier={{
                    projectId: 'project-id',
                    workspaceId: 'workspace-id',
                    organizationId: 'organization-id',
                }}
            >
                <AcceptButton navigate={navigate} />
            </ProjectProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const filesData = [mockedScreenshot];

    it('load the files and delete the screenshots', async () => {
        const mockedNavigate = jest.fn();
        const mockedDeleteMany = jest.fn();
        const mockedUpdateMany = jest.fn().mockResolvedValue('');

        await renderApp({
            filesData,
            navigate: mockedNavigate,
            updateMany: mockedUpdateMany,
            deleteMany: mockedDeleteMany,
        });

        await waitFor(() => {
            fireEvent.click(screen.getByRole('button', { name: /accept/i }));
        });

        expect(screen.getByText('Preparing media upload...')).toBeVisible();
        expect(mockedDeleteMany).toHaveBeenCalledWith([mockedScreenshot.id]);
        expect(mockedNavigate).toHaveBeenCalledWith(
            `/organizations/${mockedDatasetIdentifier.organizationId}/workspaces/${mockedDatasetIdentifier.workspaceId}/projects/${mockedDatasetIdentifier.projectId}/datasets/${mockedDatasetIdentifier.datasetId}`
        );
    });

    it('insufficient storage', async () => {
        await renderApp({ filesData, insufficientStorage: true });

        await waitFor(async () => {
            expect(screen.getByRole('button', { name: /accept/i })).toBeVisible();
        });

        await checkTooltip(screen.getByRole('button', { name: /accept/i }), insufficientStorageMessage);
    });
});
