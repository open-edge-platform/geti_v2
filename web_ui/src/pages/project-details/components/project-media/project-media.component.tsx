// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useState } from 'react';

import { AlertDialog, DialogContainer, Flex } from '@geti/ui';
import { useOverlayTriggerState } from 'react-stately';

import { isAnomalyDomain } from '../../../../core/projects/domains';
import { MediaUploadActionTypes } from '../../../../providers/media-upload-provider/media-upload-reducer-actions';
import { UploadMedia } from '../../../../providers/media-upload-provider/media-upload.interface';
import { CustomerSupportLink } from '../../../../shared/components/customer-support-link/customer-support-link.component';
import { isImgOrVideoFile } from '../../../../shared/media-utils';
import { useDatasetIdentifier } from '../../../annotator/hooks/use-dataset-identifier.hook';
import { useProject } from '../../providers/project-provider/project-provider.component';
import { useDatasetMediaUpload } from '../project-dataset/hooks/dataset-media-upload';
import { useSelectedDataset } from '../project-dataset/use-selected-dataset/use-selected-dataset.hook';
import { AnomalyMediaContent } from './anomaly-media-content.component';
import { MediaContent } from './media-content.component';
import { PreviewGalleryDialog } from './preview-gallery-dialog/preview-gallery-dialog.component';
import { AnomalyProjectsNotification } from './training-notification/anomaly-projects-notification.component';
import { UploadStatusBar } from './upload-status-bar/upload-status-bar.component';

type BucketFiles = Pick<UploadMedia, 'files' | 'labelIds'>;

export const ProjectMedia = (): JSX.Element => {
    const [droppedFiles, setDroppedFiles] = useState<BucketFiles | null>(null);

    const selectedDataset = useSelectedDataset();
    const datasetIdentifier = useDatasetIdentifier();
    const galleryPreviewState = useOverlayTriggerState({});
    const { isSingleDomainProject, project } = useProject();
    const { mediaUploadState, onUploadMedia, dispatch, abort, reset } = useDatasetMediaUpload();

    const isSingleAnomalyProject = isSingleDomainProject(isAnomalyDomain);

    // We should only show the training progress component for anomaly projects
    // and training datasets.
    const showTrainingProcessComponent = isSingleAnomalyProject && selectedDataset.useForTraining;

    const handleUploadMediaCallback = async (uploads: UploadMedia) => {
        const validFiles = uploads.files.filter((file) => isImgOrVideoFile(file));

        setDroppedFiles({ files: validFiles, labelIds: uploads.labelIds });
        galleryPreviewState.open();
    };

    const handlePreviewLoad = (files: File[], labelIds: string[] | undefined) =>
        onUploadMedia({ datasetIdentifier, files, labelIds });

    const handlePreviewClose = () => {
        setDroppedFiles(null);
        galleryPreviewState.close();
    };

    return (
        <Flex height='100%'>
            <PreviewGalleryDialog
                key={droppedFiles?.files.length}
                files={droppedFiles?.files ?? []}
                labelIds={droppedFiles?.labelIds ?? []}
                isOpen={galleryPreviewState.isOpen}
                onClose={handlePreviewClose}
                onUpload={handlePreviewLoad}
            />

            {isSingleAnomalyProject ? (
                <AnomalyMediaContent
                    labels={project.labels}
                    onUploadMedia={handleUploadMediaCallback}
                    mediaUploadState={mediaUploadState}
                    dispatch={dispatch}
                />
            ) : (
                <MediaContent
                    mediaUploadState={mediaUploadState}
                    dispatch={dispatch}
                    onUploadMedia={handleUploadMediaCallback}
                />
            )}

            <UploadStatusBar
                reset={reset}
                onUploadMedia={handleUploadMediaCallback}
                mediaUploadState={mediaUploadState}
                abortMediaUploads={abort}
            />

            <DialogContainer
                onDismiss={() =>
                    dispatch({
                        type: MediaUploadActionTypes.SET_INSUFFICIENT_STORAGE,
                        payload: false,
                        datasetId: datasetIdentifier.datasetId,
                    })
                }
            >
                {mediaUploadState.insufficientStorage && (
                    <AlertDialog title='ERROR 507: Insufficient Storage' variant='error' primaryActionLabel='Close'>
                        Your server is running low on disk space. Please contact <CustomerSupportLink /> to find out
                        possible solutions.
                    </AlertDialog>
                )}
            </DialogContainer>

            {showTrainingProcessComponent && <AnomalyProjectsNotification />}
        </Flex>
    );
};
