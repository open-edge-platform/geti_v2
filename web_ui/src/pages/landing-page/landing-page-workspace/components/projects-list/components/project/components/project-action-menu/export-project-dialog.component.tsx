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

import { ProjectIdentifier } from '../../../../../../../../../core/projects/core.interface';
import { EXPORT_PROJECT_MODELS_OPTIONS } from '../../../../../../../../../core/projects/project.interface';
import { useWorkspaceIdentifier } from '../../../../../../../../../providers/workspaces-provider/use-workspace-identifier.hook';
import { formatToLabel } from './utils';

interface ExportProjectDialogProps {
    isOpen: boolean;
    projectId: string;
    onClose: () => void;
    onExportProject: (projectIdentifier: ProjectIdentifier, selectedModels: EXPORT_PROJECT_MODELS_OPTIONS) => void;
}

export const ExportProjectDialog = ({
    onClose,
    isOpen,
    onExportProject,
    projectId,
}: ExportProjectDialogProps): JSX.Element => {
    const [selectedModels, setSelectedModels] = useState(EXPORT_PROJECT_MODELS_OPTIONS.ALL);
    const isSaveButtonDisabled = isEmpty(selectedModels);
    const { organizationId, workspaceId } = useWorkspaceIdentifier();

    const handleExportProject = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isSaveButtonDisabled) {
            return;
        }

        onExportProject({ organizationId, workspaceId, projectId }, selectedModels);
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
                                onChange={(option: string) =>
                                    setSelectedModels(option as EXPORT_PROJECT_MODELS_OPTIONS)
                                }
                            >
                                {Object.values(EXPORT_PROJECT_MODELS_OPTIONS).map(
                                    (model: EXPORT_PROJECT_MODELS_OPTIONS) => {
                                        return (
                                            <Radio key={model} value={model} aria-label={model}>
                                                {formatToLabel(model)}
                                            </Radio>
                                        );
                                    }
                                )}
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
