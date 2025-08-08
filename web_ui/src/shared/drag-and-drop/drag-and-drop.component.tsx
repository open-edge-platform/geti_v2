// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { DropZone as SpectrumDropZone, type SpectrumDropZoneProps as DropZoneProps } from '@geti/ui';
import { getFilesFromDropEvent } from '@geti/ui/utils';
import { clsx } from 'clsx';

import classes from './drag-and-drop.module.scss';

export const onDropFiles = (handleFiles: (files: File[]) => void): DropZoneProps['onDrop'] => {
    return async (event) => {
        const files = await getFilesFromDropEvent(event);

        return handleFiles(files);
    };
};

export const DropZone = (props: DropZoneProps & { background?: boolean }) => {
    const { background, UNSAFE_style, UNSAFE_className, ...rest } = props;
    const backgroundColor = background ? 'var(--spectrum-global-color-gray-100)' : 'transparent';

    return (
        <SpectrumDropZone
            UNSAFE_className={clsx(classes.dragAndDrop, UNSAFE_className)}
            UNSAFE_style={{ backgroundColor, ...UNSAFE_style }}
            margin={0}
            {...rest}
        />
    );
};
