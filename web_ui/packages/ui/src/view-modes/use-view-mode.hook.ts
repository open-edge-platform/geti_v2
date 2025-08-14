// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useLocalStorage } from 'usehooks-ts';

import { INITIAL_VIEW_MODE, VIEW_MODE_KEY } from './utils';

const getMediaViewModeKey = (suffix: string) => {
    return `${VIEW_MODE_KEY}-${suffix}`;
};

export const useViewMode = (suffix: string, defaultViewMode = INITIAL_VIEW_MODE) => {
    return useLocalStorage(getMediaViewModeKey(suffix), defaultViewMode);
};
