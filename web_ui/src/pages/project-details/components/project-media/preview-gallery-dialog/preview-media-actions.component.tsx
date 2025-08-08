// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ActionButton, AlertDialog, DialogContainer, Flex } from '@geti/ui';
import { Delete } from '@geti/ui/icons';
import { isEmpty } from 'lodash-es';
import { useOverlayTriggerState } from 'react-stately';

import { Label } from '../../../../../core/labels/label.interface';
import { CondensedLabelSelector } from '../../../../../shared/components/media-preview-list/condensed-label-selector.component';
import { ViewModes } from '../../../../../shared/components/media-view-modes/utils';
import { useTask } from '../../../../annotator/providers/task-provider/task-provider.component';
import { getSingleValidTask } from '../../../../utils';

interface PreviewMediaActionsProps {
    labelIds: string[];
    viewMode: ViewModes;
    selectedFilesCount: number;
    onDeleteMany: () => void;
    onSelectLabel: (labels: Label[]) => void;
}

export const PreviewMediaActions = ({
    viewMode,
    labelIds,
    selectedFilesCount,
    onDeleteMany,
    onSelectLabel,
}: PreviewMediaActionsProps) => {
    const { tasks } = useTask();
    const alertDialogState = useOverlayTriggerState({});
    const labelSelectorState = useOverlayTriggerState({});

    const filteredTasks = getSingleValidTask(tasks);
    const taskLabels = filteredTasks.flatMap(({ labels }) => labels);

    return (
        <>
            <ActionButton isQuiet onPress={alertDialogState.toggle} aria-label={'delete'}>
                <Delete />
            </ActionButton>

            <CondensedLabelSelector
                hideLabelsName
                viewMode={viewMode}
                labelIds={labelIds}
                title={'Label selected items'}
                isDisabled={isEmpty(taskLabels)}
                triggerState={labelSelectorState}
                onSelectLabel={onSelectLabel}
                UNSAFE_style={{ background: 'none' }}
            />

            <Flex marginStart={'auto'}>Selected items: {selectedFilesCount}</Flex>

            <DialogContainer onDismiss={alertDialogState.close}>
                {alertDialogState.isOpen && (
                    <AlertDialog
                        title={'Delete items'}
                        variant={'destructive'}
                        cancelLabel={'Cancel'}
                        primaryActionLabel={'Delete'}
                        onCancel={alertDialogState.close}
                        onPrimaryAction={() => {
                            onDeleteMany();
                            alertDialogState.close();
                        }}
                    >
                        Are you sure you want to delete {selectedFilesCount} items?
                    </AlertDialog>
                )}
            </DialogContainer>
        </>
    );
};
