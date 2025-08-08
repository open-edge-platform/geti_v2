// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Key, useState } from 'react';

import {
    Button,
    ButtonGroup,
    Checkbox,
    Content,
    Dialog,
    DialogContainer,
    Divider,
    Flex,
    Heading,
    Selection,
} from '@geti/ui';
import { differenceBy, isEmpty, orderBy } from 'lodash-es';

import { Label } from '../../../../../core/labels/label.interface';
import { DOMAIN } from '../../../../../core/projects/core.interface';
import { isAnomalyDomain } from '../../../../../core/projects/domains';
import { useViewMode } from '../../../../../hooks/use-view-mode/use-view-mode.hook';
import { MEDIA_CONTENT_BUCKET } from '../../../../../providers/media-upload-provider/media-upload.interface';
import { DeleteItemButton } from '../../../../../shared/components/delete-item-button/delete-item-button.component';
import { SelectionCheckbox } from '../../../../../shared/components/media-preview-list/checkbox.component';
import { MediaPreviewList } from '../../../../../shared/components/media-preview-list/media-preview-list.component';
import { INITIAL_VIEW_MODE } from '../../../../../shared/components/media-view-modes/utils';
import { getIds } from '../../../../../shared/utils';
import { TaskProvider } from '../../../../annotator/providers/task-provider/task-provider.component';
import { useProject } from '../../../providers/project-provider/project-provider.component';
import { PreviewMediaActions } from './preview-media-actions.component';
import { PreviewMediaToolbar } from './preview-media-toolbar.component';
import {
    getSelectedLabelIds,
    PreviewFile,
    removeMultipleSelections,
    SortingOptions,
    toggleItemSelection,
    toggleMultipleSelection,
    updateLabels,
} from './utils';

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
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
    const areAllItemsSelected = selectedKeys === 'all';

    const hasLabelSelector = isSingleDomainProject(DOMAIN.CLASSIFICATION) || isSingleDomainProject(isAnomalyDomain);
    const selectedFilesCount = areAllItemsSelected ? currentFiles.length : selectedKeys.size;
    const hasSelectedItems = areAllItemsSelected || selectedKeys.size > 0;
    const selectedLabelIds = areAllItemsSelected ? [] : getSelectedLabelIds(currentFiles, selectedKeys);

    const handleUpdateItem = (id: string, updatedItem: PreviewFile) => {
        setCurrentFiles((currentItems) => currentItems.map(updateItem(id, updatedItem)));
    };

    const handleUpload = () => {
        const groupedByLabel = Object.groupBy(currentFiles, (file) => String(file.labelIds));

        Object.entries(groupedByLabel).forEach(([ids, items]) => onUpload(getFiles(items), getLabelsIds(ids)));

        onClose();
    };

    const handleSortFiles = (option: Key) => {
        const order = option === SortingOptions.LABEL_NAME_A_Z ? 'asc' : 'desc';

        setCurrentFiles((prevFiles) => orderBy(prevFiles, ['labelName'], order));
    };

    const handleDeleteFiles = (ids: Key[]) => {
        const filesToDelete = ids.map((id) => ({ id }));

        setSelectedKeys(removeMultipleSelections(ids));

        setCurrentFiles((prevFiles) => differenceBy(prevFiles, filesToDelete, 'id'));
    };

    const handleToggleSelection = (id: string) => {
        setSelectedKeys(toggleItemSelection(id));
    };

    const handleToggleManyItemSelection = () => {
        setSelectedKeys(toggleMultipleSelection(currentFiles));
    };

    const handleManyLabels = (newLabels: Label[]) => {
        const newLabelIds = getIds(newLabels);

        setCurrentFiles((currentItems) => currentItems.map(updateLabels(selectedKeys, newLabelIds)));
    };

    const handleDeleteManyFiles = () => {
        handleDeleteFiles(selectedKeys === 'all' ? getIds(currentFiles) : selectedKeys.values().toArray());
    };

    return (
        <TaskProvider>
            <DialogContainer onDismiss={onClose} type='fullscreen'>
                {isOpen && (
                    <Dialog>
                        <Heading>Preview gallery</Heading>
                        <Divider />

                        <Content>
                            <Flex height={'size-400'} marginBottom={'size-100'} gap={'size-100'}>
                                <Checkbox
                                    aria-label={'Select media items'}
                                    isSelected={hasSelectedItems}
                                    onChange={handleToggleManyItemSelection}
                                />
                                {hasSelectedItems ? (
                                    <PreviewMediaActions
                                        viewMode={viewMode}
                                        labelIds={selectedLabelIds}
                                        selectedFilesCount={selectedFilesCount}
                                        onDeleteMany={handleDeleteManyFiles}
                                        onSelectLabel={handleManyLabels}
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
                                selectedKeys={selectedKeys}
                                hasLabelSelector={hasLabelSelector}
                                onUpdateItem={handleUpdateItem}
                                onSelectionChange={setSelectedKeys}
                                topLeftElement={(id) => (
                                    <SelectionCheckbox
                                        isSelected={selectedKeys instanceof Set && selectedKeys.has(id)}
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
