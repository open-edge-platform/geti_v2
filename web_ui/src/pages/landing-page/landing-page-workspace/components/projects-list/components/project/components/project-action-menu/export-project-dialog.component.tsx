// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FormEvent, useState } from 'react';

import {
    Button,
    ButtonGroup,
    Content,
    Dialog,
    DialogContainer,
    Divider,
    Form,
    Heading,
    Radio,
    RadioGroup,
} from '@geti/ui';
import { isEmpty } from 'lodash-es';

import { AVAILABLE_EXPORT_MODELS, formatToLabel } from './utils';

interface ExportProjectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onExportProject: () => void;
}

export const ExportProjectDialog = ({ onClose, isOpen, onExportProject }: ExportProjectDialogProps): JSX.Element => {
    const [selectedModels, setSelectedModels] = useState('');
    const isSaveButtonDisabled = isEmpty(selectedModels);

    const handleExportProject = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isSaveButtonDisabled) {
            return;
        }

        onExportProject();
        onClose();
    };

    const handleDismiss = () => {
        onClose();
    };

    return (
        <DialogContainer onDismiss={handleDismiss}>
            {isOpen && (
                <Dialog>
                    <Heading>Export project</Heading>
                    <Divider />
                    <Content>
                        <Form onSubmit={handleExportProject}>
                            <RadioGroup
                                label={'Select models for export'}
                                aria-label={'Export models'}
                                value={selectedModels}
                                onChange={(option: string) => setSelectedModels(option as AVAILABLE_EXPORT_MODELS)}
                            >
                                {Object.values(AVAILABLE_EXPORT_MODELS).map((model: AVAILABLE_EXPORT_MODELS) => {
                                    return (
                                        <Radio value={model} aria-label={model}>
                                            {formatToLabel(model)}
                                        </Radio>
                                    );
                                })}
                            </RadioGroup>
                            <ButtonGroup align={'end'} marginTop={'size-350'}>
                                <Button variant='secondary' onPress={handleDismiss}>
                                    Cancel
                                </Button>
                                <Button type='submit' variant='accent' isDisabled={isSaveButtonDisabled}>
                                    Export
                                </Button>
                            </ButtonGroup>
                        </Form>
                    </Content>
                </Dialog>
            )}
        </DialogContainer>
    );
};
