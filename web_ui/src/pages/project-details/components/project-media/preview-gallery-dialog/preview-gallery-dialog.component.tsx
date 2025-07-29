// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useState } from 'react';

import { Button, ButtonGroup, Content, Dialog, DialogContainer, Divider, Flex, Heading, Text } from '@geti/ui';
import { isEmpty } from 'lodash-es';

import { DOMAIN } from '../../../../../core/projects/core.interface';
import { isAnomalyDomain } from '../../../../../core/projects/domains';
import { useViewMode } from '../../../../../hooks/use-view-mode/use-view-mode.hook';
import { MEDIA_CONTENT_BUCKET } from '../../../../../providers/media-upload-provider/media-upload.interface';
import { MediaPreviewList } from '../../../../../shared/components/media-preview-list/media-preview-list.component';
import { MediaViewModes } from '../../../../../shared/components/media-view-modes/media-view-modes.component';
import { INITIAL_VIEW_MODE, ViewModes } from '../../../../../shared/components/media-view-modes/utils';
import { hasDifferentId } from '../../../../../shared/utils';
import { TaskProvider } from '../../../../annotator/providers/task-provider/task-provider.component';
import { useProject } from '../../../providers/project-provider/project-provider.component';
import { PreviewFile } from './utils';

export interface PreviewGalleryDialogProps {
    files: File[];
    isOpen: boolean;
    labelIds: string[];
    onClose: () => void;
    onUpload: (files: File[], labelIds?: string[]) => Promise<void>;
}

const updateItem = (id: string, updatedItem: PreviewFile) => (item: PreviewFile) =>
    item.id !== id ? item : { ...updatedItem, id };

const getFiles = (items: PreviewFile[] | undefined) => items?.map(({ file }) => file) ?? [];
const getLabelsIds = (labelsIds: string) => (isEmpty(labelsIds) ? undefined : labelsIds.split(','));
const getMediaItemFromFile =
    (labelIds: string[]) =>
    (file: File): PreviewFile => ({ id: file.name, file, labelIds });

const PREVIEW_GALLERY_HEIGHT_OFFSET = 'size-550';

export const PreviewGalleryDialog = ({
    isOpen,
    files: initFiles,
    labelIds,
    onClose,
    onUpload,
}: PreviewGalleryDialogProps) => {
    const { isSingleDomainProject } = useProject();
    const [viewMode, setViewMode] = useViewMode(MEDIA_CONTENT_BUCKET.GENERIC, INITIAL_VIEW_MODE);
    const [currentFiles, setCurrentFiles] = useState(initFiles.map(getMediaItemFromFile(labelIds)));

    const hasLabelSelector = isSingleDomainProject(DOMAIN.CLASSIFICATION) || isSingleDomainProject(isAnomalyDomain);

    const handleDeleteItems = async (id: string) => {
        setCurrentFiles((prevFiles) => prevFiles.filter(hasDifferentId(id)));
    };

    const handleUpdateItem = async (id: string, updatedItem: PreviewFile) => {
        setCurrentFiles((currentItems) => currentItems.map(updateItem(id, updatedItem)));
    };

    const handleUpload = async () => {
        const groupedByLabel = Object.groupBy(currentFiles, (file) => String(file.labelIds));

        Object.entries(groupedByLabel).forEach(([ids, items]) => onUpload(getFiles(items), getLabelsIds(ids)));

        onClose();
    };

    return (
        <TaskProvider>
            <DialogContainer onDismiss={onClose} type='fullscreen'>
                {isOpen && (
                    <Dialog>
                        <Heading>Preview gallery</Heading>
                        <Divider />

                        <Content>
                            <Flex gap={'size-100'} alignItems={'center'} justifyContent={'end'}>
                                <Text>{viewMode} </Text>
                                <MediaViewModes
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                    items={[ViewModes.LARGE, ViewModes.MEDIUM, ViewModes.SMALL]}
                                />
                            </Flex>

                            <MediaPreviewList
                                items={currentFiles}
                                height={`calc(100% - ${PREVIEW_GALLERY_HEIGHT_OFFSET})`}
                                viewMode={viewMode}
                                hasItemPreview={false}
                                hasLabelSelector={hasLabelSelector}
                                onDeleteItem={handleDeleteItems}
                                onUpdateItem={handleUpdateItem}
                            />
                        </Content>

                        <ButtonGroup>
                            <Button type='button' variant={'secondary'} onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type='button'
                                variant={'accent'}
                                onPress={handleUpload}
                                isDisabled={isEmpty(currentFiles)}
                            >
                                Upload
                            </Button>
                        </ButtonGroup>
                    </Dialog>
                )}
            </DialogContainer>
        </TaskProvider>
    );
};
