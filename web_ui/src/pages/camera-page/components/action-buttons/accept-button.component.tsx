// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useState } from 'react';

import { paths } from '@geti/core';
import { Button, toast } from '@geti/ui';
import { groupBy, isEmpty } from 'lodash-es';
import { NavigateFunction } from 'react-router-dom';

import { DatasetIdentifier } from '../../../../core/projects/dataset.interface';
import { TooltipWithDisableButton } from '../../../../shared/components/custom-tooltip/tooltip-with-disable-button';
import { getIds } from '../../../../shared/utils';
import { useDatasetMediaUpload } from '../../../project-details/components/project-dataset/hooks/dataset-media-upload';
import { useCameraParams } from '../../hooks/camera-params.hook';
import { useCameraStorage } from '../../hooks/use-camera-storage.hook';

interface AcceptButtonProps {
    isDisabled?: boolean;
    navigate: NavigateFunction;
}

export const insufficientStorageMessage =
    // eslint-disable-next-line max-len
    'Your server is running low on disk space. Please free up space by removing old or unused projects, or consider upgrading your hardware to increase capacity.';

const datasetPagePath = (datasetIdentifier: DatasetIdentifier) => paths.project.dataset.index(datasetIdentifier);

export const AcceptButton = ({ isDisabled, navigate }: AcceptButtonProps) => {
    const { ...datasetIdentifier } = useCameraParams();
    const { mediaUploadState, onUploadMedia } = useDatasetMediaUpload();
    const { savedFilesQuery, updateMany, deleteMany } = useCameraStorage();
    const [isPendingButton, setIsPendingButton] = useState(false);

    const handleScreenLoading = async () => {
        const updatedSavedFiles = await savedFilesQuery.refetch();

        const screenshotDict = groupBy(updatedSavedFiles.data, ({ labelIds }) => String(labelIds));

        return Promise.all(
            Object.entries(screenshotDict).map(async ([labelsIds, screenshots]) => {
                await deleteMany(getIds(screenshots));
                await onUploadMedia({
                    labelIds: isEmpty(labelsIds) ? undefined : labelsIds.split(','),
                    files: screenshots.map(({ file }) => file),
                    datasetIdentifier,
                });
            })
        );
    };

    const handleMediaUpload = async () => {
        setIsPendingButton(true);

        try {
            toast({ message: 'Preparing media upload...', type: 'info' });
            await updateMany(getIds(savedFilesQuery.data ?? []), {});
            await handleScreenLoading();
            navigate(datasetPagePath(datasetIdentifier));
        } catch (_error) {
            toast({ type: 'error', message: 'There was an issue while uploading the media files. Please try again.' });
        } finally {
            setIsPendingButton(false);
        }
    };

    return (
        <TooltipWithDisableButton
            placement={'bottom'}
            disabledTooltip={mediaUploadState.insufficientStorage ? insufficientStorageMessage : ''}
        >
            <Button
                variant={'accent'}
                isPending={isPendingButton}
                isDisabled={isDisabled || isPendingButton || mediaUploadState.insufficientStorage}
                onPress={handleMediaUpload}
            >
                Accept
            </Button>
        </TooltipWithDisableButton>
    );
};
