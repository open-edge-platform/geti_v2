// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { toast } from '@geti/ui';
import { isEmpty } from 'lodash-es';

export const useClipboard = () => {
    const copy = (text: string, successMessage = 'Copied Successfully', errorMessage = 'Copy failed') =>
        navigator.clipboard
            .writeText(text)
            .then(() => !isEmpty(successMessage) && toast({ message: successMessage, type: 'info' }))
            .catch(() => toast({ message: errorMessage, type: 'error' }));

    return { copy };
};
