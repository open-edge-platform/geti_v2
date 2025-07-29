// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Key, useState } from 'react';

import { Button, ButtonGroup, Checkbox, Content, Dialog, DialogContainer, Divider, Flex, Heading } from '@geti/ui';
import { differenceBy, identity, isEmpty, omit, orderBy } from 'lodash-es';

import { DOMAIN } from '../../../../../core/projects/core.interface';
import { isAnomalyDomain } from '../../../../../core/projects/domains';
import { useViewMode } from '../../../../../hooks/use-view-mode/use-view-mode.hook';
import { MEDIA_CONTENT_BUCKET } from '../../../../../providers/media-upload-provider/media-upload.interface';
import { DeleteItemButton } from '../../../../../shared/components/delete-item-button/delete-item-button.component';
import { SelectionCheckbox } from '../../../../../shared/components/media-preview-list/checkbox.component';
import { MediaPreviewList } from '../../../../../shared/components/media-preview-list/media-preview-list.component';
import { INITIAL_VIEW_MODE } from '../../../../../shared/components/media-view-modes/utils';
import { TaskProvider } from '../../../../annotator/providers/task-provider/task-provider.component';
import { useProject } from '../../../providers/project-provider/project-provider.component';
import { PreviewMediaActions } from './preview-media-actions.component';
import { PreviewMediaToolbar } from './preview-media-toolbar.component';
import { PreviewFile, SortingOptions } from './utils';

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
const selectAllItems = (currentFiles: PreviewFile[]) =>
    currentFiles.reduce((accumulator, currentId) => ({ ...accumulator, [currentId.id]: true }), {});

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
    const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>({});

    const hasLabelSelector = isSingleDomainProject(DOMAIN.CLASSIFICATION) || isSingleDomainProject(isAnomalyDomain);
    const selectedFilesCount = Object.values(selectedFiles).filter(identity).length;
    const hasSelectedItems = selectedFilesCount > 0;

    const handleUpdateItem = async (id: string, updatedItem: PreviewFile) => {
        setCurrentFiles((currentItems) => currentItems.map(updateItem(id, updatedItem)));
    };

    const handleUpload = async () => {
        const groupedByLabel = Object.groupBy(currentFiles, (file) => String(file.labelIds));

        Object.entries(groupedByLabel).forEach(([ids, items]) => onUpload(getFiles(items), getLabelsIds(ids)));

        onClose();
    };

    const handleSortFiles = (option: Key) => {
        const order = option === SortingOptions.LABEL_NAME_A_Z ? 'asc' : 'desc';

        setCurrentFiles((prevFiles) => orderBy(prevFiles, ['labelName'], order));
    };

    const handleDeleteFiles = (ids: string[]) => {
        const filesToDelete = ids.map((id) => ({ id }));

        setSelectedFiles((prevFiles) => omit(prevFiles, ids));
        setCurrentFiles((prevFiles) => differenceBy(prevFiles, filesToDelete, 'id'));
    };

    const handleToggleSelection = (id: string) => {
        setSelectedFiles((prevSelected) => {
            const isSelected = prevSelected[id] ?? false;

            return isSelected ? omit(prevSelected, id) : { ...prevSelected, [id]: true };
        });
    };

    const handleToggleManyItemSelection = () => {
        const areAllItemsSelected = selectedFilesCount === currentFiles.length;

        setSelectedFiles(() => (areAllItemsSelected ? {} : selectAllItems(currentFiles)));
    };

    return (
        <TaskProvider>
            <DialogContainer onDismiss={onClose} type='fullscreen'>
                {isOpen && (
                    <Dialog>
                        <Heading>Preview gallery</Heading>
                        <Divider />

                        <Content>
                            <Flex height={'size-400'}>
                                <Checkbox
                                    aria-label={'Select media items'}
                                    isSelected={hasSelectedItems}
                                    onChange={handleToggleManyItemSelection}
                                />
                                {hasSelectedItems ? (
                                    <PreviewMediaActions
                                        selectedFilesCount={selectedFilesCount}
                                        onDeleteMany={() => handleDeleteFiles(Object.keys(selectedFiles))}
                                    />
                                ) : (
                                    <PreviewMediaToolbar
                                        viewMode={viewMode}
                                        onSortItems={handleSortFiles}
                                        onViewModeChange={setViewMode}
                                    />
                                )}
                            </Flex>

                            <MediaPreviewList
                                items={currentFiles}
                                height={`calc(100% - ${PREVIEW_GALLERY_HEIGHT_OFFSET})`}
                                viewMode={viewMode}
                                hasLabelSelector={hasLabelSelector}
                                selectedItems={selectedFiles}
                                onUpdateItem={handleUpdateItem}
                                onPress={handleToggleSelection}
                                topLeftElement={(id) => (
                                    <SelectionCheckbox
                                        isSelected={selectedFiles[id] ?? false}
                                        onToggle={() => handleToggleSelection(id)}
                                    />
                                )}
                                topRightElement={(id: string) => (
                                    <DeleteItemButton id={id} onDeleteItem={() => handleDeleteFiles([id])} />
                                )}
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
