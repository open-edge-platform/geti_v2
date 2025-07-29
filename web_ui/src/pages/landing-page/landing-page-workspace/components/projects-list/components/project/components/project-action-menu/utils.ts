// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { EXPORT_PROJECT_MODELS_OPTIONS } from '../../../../../../../../../core/projects/project.interface';

export const formatToLabel = (option: EXPORT_PROJECT_MODELS_OPTIONS): string => {
    switch (option) {
        case EXPORT_PROJECT_MODELS_OPTIONS.ALL:
            return 'All models';
        case EXPORT_PROJECT_MODELS_OPTIONS.NONE:
            return 'None';
        case EXPORT_PROJECT_MODELS_OPTIONS.LATEST_ACTIVE:
            return 'Latest active model';
        default:
            return option;
    }
};
