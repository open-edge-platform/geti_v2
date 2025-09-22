// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useRef } from 'react';

import { removeToast, toast } from '@geti/ui';

interface DeletionStatusBarProps {
    visible: boolean;
}

export const DeletionStatusBar = ({ visible }: DeletionStatusBarProps) => {
    const deletingMediasRef = useRef<string | number>('');

    useEffect(() => {
        if (!visible) {
            removeToast(deletingMediasRef.current);
        }

        if (visible) {
            deletingMediasRef.current = toast({
                hasCloseButton: false,
                message: 'Media deletion in progress...',
                type: 'neutral',
                duration: Infinity,
            });
        }
    }, [visible]);

    return <></>;
};
