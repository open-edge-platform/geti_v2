// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Button, FileTrigger, Flex, toast } from '@geti/ui';
import { Image } from '@geti/ui/icons';

import {
    getImageMimeType,
    mediaExtensionHandler,
} from '../../../../../providers/media-upload-provider/media-upload.validator';
import { loadImageFromFile, VALID_IMAGE_TYPES_SINGLE_UPLOAD } from '../../../../../shared/media-utils';
import { onValidImageFormat } from '../../../../utils';

interface LoadFileButtonProps {
    onFileLoaded: (image: string) => void;
}

export const errorMessage =
    'Only image files are supported for this feature. Allowed formats: ' +
    mediaExtensionHandler(VALID_IMAGE_TYPES_SINGLE_UPLOAD);

export const LoadFileButton = ({ onFileLoaded }: LoadFileButtonProps) => {
    const handleValidFormat = async ([file]: File[]) => {
        const image = await loadImageFromFile(file);
        onFileLoaded(image.src);
    };

    const handleInvalidFormat = () => {
        toast({ message: errorMessage, type: 'error' });
    };

    const handleUploadFile = onValidImageFormat(handleValidFormat, handleInvalidFormat);

    return (
        <FileTrigger
            onSelect={handleUploadFile}
            acceptedFileTypes={getImageMimeType(VALID_IMAGE_TYPES_SINGLE_UPLOAD)}
            aria-label='upload sample image'
            data-testid='upload-sample-image'
        >
            <Button variant={'secondary'} maxWidth={'size-3000'}>
                <Flex gap={'size-75'} alignItems={'center'}>
                    <Image />
                    Upload sample image
                </Flex>
            </Button>
        </FileTrigger>
    );
};
