// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ActionButton, AlertDialog, DialogContainer, Flex } from '@geti/ui';
import { Delete } from '@geti/ui/icons';
import { useOverlayTriggerState } from 'react-stately';

interface PreviewMediaActionsProps {
    selectedFilesCount: number;
    onDeleteMany: () => void;
}

export const PreviewMediaActions = ({ selectedFilesCount, onDeleteMany }: PreviewMediaActionsProps) => {
    const alertDialogState = useOverlayTriggerState({});

    return (
        <>
            <ActionButton isQuiet onPress={alertDialogState.toggle} aria-label={'delete'}>
                <Delete />
            </ActionButton>

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
