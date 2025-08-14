// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useLocalStorage } from 'usehooks-ts';

import { INITIAL_VIEW_MODE, VIEW_MODE_KEY } from './utils';

const getMediaViewModeKey = (subfix: string) => {
    return `${VIEW_MODE_KEY}-${subfix}`;
};

export const useViewMode = (subfix: string, defaultViewMode = INITIAL_VIEW_MODE) => {
    return useLocalStorage(getMediaViewModeKey(subfix), defaultViewMode);
};
