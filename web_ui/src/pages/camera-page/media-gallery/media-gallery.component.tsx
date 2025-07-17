// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useState } from 'react';

import { paths } from '@geti/core';
import { Flex, Heading, Text, View } from '@geti/ui';
import { isEmpty } from 'lodash-es';
import { useNavigate } from 'react-router-dom';

import { DatasetIdentifier } from '../../../core/projects/dataset.interface';
import { useViewMode } from '../../../hooks/use-view-mode/use-view-mode.hook';
import { MEDIA_CONTENT_BUCKET } from '../../../providers/media-upload-provider/media-upload.interface';
import { MediaPreviewList } from '../../../shared/components/media-preview-list/media-preview-list.component';
import { MediaViewModes } from '../../../shared/components/media-view-modes/media-view-modes.component';
import { INITIAL_VIEW_MODE, ViewModes } from '../../../shared/components/media-view-modes/utils';
import { Screenshot } from '../../camera-support/camera.interface';
import { ActionButtons } from '../components/action-buttons/action-buttons.component';
import { useCameraParams } from '../hooks/camera-params.hook';
import { useCameraStorage } from '../hooks/use-camera-storage.hook';
import { getSortingHandler, SortingOptions } from './../util';
import { SortByDropdown } from './components/sort-by-dropdown.component';

const cameraPagePath = (datasetIdentifier: DatasetIdentifier) => paths.project.dataset.camera(datasetIdentifier);

export const MediaGallery = (): JSX.Element => {
    const navigate = useNavigate();
    const { hasDefaultLabel, defaultLabelId, ...rest } = useCameraParams();
    const { savedFilesQuery, deleteMany, updateMany } = useCameraStorage();
    const [viewMode, setViewMode] = useViewMode(MEDIA_CONTENT_BUCKET.GENERIC, INITIAL_VIEW_MODE);
    const [sortingOption, setSortingOption] = useState(SortingOptions.MOST_RECENT);

    const sortingHandler = getSortingHandler(sortingOption);
    const screenshots = sortingHandler(savedFilesQuery?.data ?? []);

    useEffect(() => {
        if (isEmpty(screenshots)) {
            navigate(
                hasDefaultLabel ? `${cameraPagePath(rest)}?defaultLabelId=${defaultLabelId}` : cameraPagePath(rest)
            );
        }
    });

    const handleDeleteItem = (id: string) => {
        return deleteMany([id]);
    };

    const handleUpdateItem = (id: string, item: Partial<Screenshot>) => {
        return updateMany([id], item);
    };

    return (
        <View padding={'size-250'} backgroundColor={'gray-75'}>
            <Flex direction={'row'} justifyContent={'space-between'}>
                <Flex direction={'column'}>
                    <Heading level={6} UNSAFE_style={{ fontWeight: '700' }} margin={0}>
                        {/* TODO: Change to "Images and videos once we support videos" */}
                        Images
                    </Heading>
                    <Text UNSAFE_style={{ color: 'var(--spectrum-global-color-gray-700)' }}>View all captures</Text>
                </Flex>

                <ActionButtons canGoToCameraPage />
            </Flex>

            <View
                overflow={'auto'}
                padding={'size-300'}
                marginTop={'size-275'}
                backgroundColor={'gray-50'}
                height={`calc(100vh - size-2000)`}
            >
                <Flex justifyContent={'space-between'} marginBottom={'size-115'}>
                    <SortByDropdown onSelect={setSortingOption} />
                    <Flex gap={'size-100'} alignItems={'center'}>
                        <Text>{viewMode} </Text>
                        <MediaViewModes
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            items={[ViewModes.LARGE, ViewModes.MEDIUM, ViewModes.SMALL]}
                        />
                    </Flex>
                </Flex>

                <MediaPreviewList
                    items={screenshots}
                    viewMode={viewMode}
                    height={`calc(100% - size-550)`}
                    onDeleteItem={handleDeleteItem}
                    onUpdateItem={handleUpdateItem}
                />
            </View>
        </View>
    );
};
