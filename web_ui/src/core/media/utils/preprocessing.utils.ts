// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { MEDIA_PREPROCESSING_STATUS } from '../base.interface';

export const isMediaPreprocessing = (status?: MEDIA_PREPROCESSING_STATUS): boolean => {
    return status === MEDIA_PREPROCESSING_STATUS.SCHEDULED || status === MEDIA_PREPROCESSING_STATUS.IN_PROGRESS;
};

export const getDefaultPreprocessingStatus = (status?: MEDIA_PREPROCESSING_STATUS): MEDIA_PREPROCESSING_STATUS => {
    return status ?? MEDIA_PREPROCESSING_STATUS.FINISHED;
};
