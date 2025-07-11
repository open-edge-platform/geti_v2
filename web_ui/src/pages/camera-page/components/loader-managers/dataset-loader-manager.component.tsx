// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { intersectionWith } from 'lodash-es';

import { MediaUploadPerDataset } from '../../../../providers/media-upload-provider/media-upload.interface';
import { getIds, isNonEmptyArray } from '../../../../shared/utils';
import { Screenshot } from '../../../camera-support/camera.interface';
import { useCameraStorage } from '../../hooks/use-camera-storage.hook';

interface DatasetLoaderManagerProps {
    mediaUploadState: MediaUploadPerDataset;
}

const isEqualFileName = (a: Screenshot, b: { fileName: string }) => a.file.name === b.fileName;

export const DatasetLoaderManager = ({ mediaUploadState }: DatasetLoaderManagerProps) => {
    const { successList, errorList, isUploadInProgress } = mediaUploadState;

    const { savedFilesQuery, deleteMany } = useCameraStorage();
    const indexedDbFiles = savedFilesQuery.data ?? [];

    const failedItems = isUploadInProgress ? [] : intersectionWith(indexedDbFiles, errorList, isEqualFileName);
    const loadedItems = isUploadInProgress ? [] : intersectionWith(indexedDbFiles, successList, isEqualFileName);
    const elementsToRemove = [...loadedItems, ...failedItems];

    if (isNonEmptyArray(elementsToRemove)) {
        deleteMany(getIds(elementsToRemove));
    }

    return <></>;
};
