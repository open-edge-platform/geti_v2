// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

export { apiClient } from './src/client/axios-instance';

export { paths } from './src/services/routes';
export { API_URLS } from './src/services/urls';
export { addHostToApiUrls } from './src/services/use-api-router.hook';

export {
    type CustomFeatureFlags,
    type FeatureFlags,
    DEV_FEATURE_FLAGS,
} from './src/feature-flags/services/feature-flag-service.interface';
