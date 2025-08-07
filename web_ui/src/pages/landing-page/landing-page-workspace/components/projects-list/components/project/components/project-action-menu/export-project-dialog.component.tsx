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
    Flex,
    Form,
    Heading,
    Radio,
    RadioGroup,
} from '@geti/ui';

import { ProjectIdentifier } from '../../../../../../../../../core/projects/core.interface';
import { EXPORT_PROJECT_MODELS_OPTIONS } from '../../../../../../../../../core/projects/project.interface';
import { useWorkspaceIdentifier } from '../../../../../../../../../providers/workspaces-provider/use-workspace-identifier.hook';
import { InfoTooltip } from '../../../../../../../../../shared/components/info-tooltip/info-tooltip.component';
import { formatToLabel } from './utils';

interface ExportProjectDialogProps {
    isOpen: boolean;
    projectId: string;
    onClose: () => void;
    onExportProject: (
        projectIdentifier: ProjectIdentifier,
        selectedModelExportOption: EXPORT_PROJECT_MODELS_OPTIONS
    ) => void;
}

export const ExportProjectDialog = ({
    onClose,
    isOpen,
    onExportProject,
    projectId,
}: ExportProjectDialogProps): JSX.Element => {
    const [selectedModelExportOption, setSelectedModelExportOption] = useState(EXPORT_PROJECT_MODELS_OPTIONS.ALL);
    const { organizationId, workspaceId } = useWorkspaceIdentifier();

    const handleExportProject = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        onExportProject({ organizationId, workspaceId, projectId }, selectedModelExportOption);
        onClose();
    };

    return (
        <DialogContainer onDismiss={onClose}>
            {isOpen && (
                <Dialog>
                    <Heading>Export project</Heading>
                    <Divider />
                    <Content>
                        <Form onSubmit={handleExportProject}>
                            <RadioGroup
                                label={
                                    <Flex gap={'size-50'} alignItems={'center'}>
                                        <span>Select models for export</span>
                                        <InfoTooltip
                                            tooltipText={
                                                'Each model will be exported along with all of its optimized variants.'
                                            }
                                        />
                                    </Flex>
                                }
                                aria-label={'Export models'}
                                value={selectedModelExportOption}
                                onChange={(option: string) =>
                                    setSelectedModelExportOption(option as EXPORT_PROJECT_MODELS_OPTIONS)
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
                                <Button variant='secondary' onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button type='submit' variant='accent'>
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
