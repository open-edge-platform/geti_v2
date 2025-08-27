// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ChangeEvent, forwardRef } from 'react';

import { toast } from '@geti/ui';

import { ImportOptions } from '../../../../../core/projects/services/project-service.interface';
import { mediaExtensionHandler } from '../../../../../providers/media-upload-provider/media-upload.validator';
import { useProjectsImportProvider } from '../../../../../providers/projects-import-provider/projects-import-provider.component';
import { isValidFileExtension } from '../../../../../shared/media-utils';

const VALID_EXTENSIONS = ['zip'];

export const ProjectImportFilePicker = forwardRef<HTMLInputElement, { options: ImportOptions }>(({ options }, ref) => {
    const { importProject } = useProjectsImportProvider();

    const onFileInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event?.target.files?.[0];
        if (file && !isValidFileExtension(file, VALID_EXTENSIONS)) {
            toast({ message: 'Invalid file extension, please try again', type: 'error' });
            return;
        }

        importProject(file as File, options);
        event.target.value = '';
    };

    return (
        <input
            hidden
            type='file'
            multiple={false}
            ref={ref}
            id={'upload-project-file-id'}
            accept={mediaExtensionHandler(VALID_EXTENSIONS)}
            onChange={onFileInputChange}
            aria-label='upload-media-input'
            style={{ pointerEvents: 'all' }}
        />
    );
});
