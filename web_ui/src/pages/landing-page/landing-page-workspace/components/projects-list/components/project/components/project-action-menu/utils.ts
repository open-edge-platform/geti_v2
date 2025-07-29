// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

export enum AVAILABLE_EXPORT_MODELS {
    ALL = 'all',
    NONE = 'none',
    LATEST_ACTIVE = 'latest_active',
}

export const formatToLabel = (option: AVAILABLE_EXPORT_MODELS): string => {
    switch (option) {
        case AVAILABLE_EXPORT_MODELS.ALL:
            return 'All models';
        case AVAILABLE_EXPORT_MODELS.NONE:
            return 'None';
        case AVAILABLE_EXPORT_MODELS.LATEST_ACTIVE:
            return 'Latest active model';
        default:
            return option;
    }
};
