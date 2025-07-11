// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useState } from 'react';

import { paths } from '@geti/core';
import { Button } from '@geti/ui';
import { groupBy, isEmpty } from 'lodash-es';
import { NavigateFunction } from 'react-router-dom';

import { DatasetIdentifier } from '../../../../core/projects/dataset.interface';
import { NOTIFICATION_TYPE } from '../../../../notification/notification-toast/notification-type.enum';
import { useNotification } from '../../../../notification/notification.component';
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
    'Your server is running low on disk space. Please contact customer support to find out possible solutions.';

const datasetPagePath = (datasetIdentifier: DatasetIdentifier) => paths.project.dataset.index(datasetIdentifier);

export const AcceptButton = ({ isDisabled, navigate }: AcceptButtonProps): JSX.Element => {
    const { addNotification } = useNotification();
    const { savedFilesQuery, updateMany } = useCameraStorage();
    const { ...datasetIdentifier } = useCameraParams();
    const { mediaUploadState, onUploadMedia } = useDatasetMediaUpload();
    const [isPendingButton, setIsPendingButton] = useState(false);

    const handleScreenLoading = async () => {
        const updatedSavedFiles = await savedFilesQuery.refetch();

        const screenshotDict = groupBy(updatedSavedFiles.data, ({ labelIds }) => String(labelIds));

        return Promise.all(
            Object.entries(screenshotDict).map(([labelsIds, screenshots]) =>
                onUploadMedia({
                    labelIds: isEmpty(labelsIds) ? undefined : labelsIds.split(','),
                    files: screenshots.map(({ file }) => file),
                    datasetIdentifier,
                })
            )
        );
    };

    const handleMediaUpload = async () => {
        setIsPendingButton(true);

        addNotification({ message: 'Preparing media upload...', type: NOTIFICATION_TYPE.INFO });
        await updateMany(getIds(savedFilesQuery.data ?? []), {});
        await handleScreenLoading();
        navigate(datasetPagePath(datasetIdentifier));

        setIsPendingButton(false);
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
