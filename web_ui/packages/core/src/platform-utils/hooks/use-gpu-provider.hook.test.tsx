// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { waitFor } from '@testing-library/react';

import { renderHookWithProviders } from '../../../../../src/test-utils/render-hook-with-providers';
import { GPUProvider } from '../dto/utils.interface';
import { createInMemoryPlatformUtilsService } from '../services/create-in-memory-platform-utils-service';
import { useGpuProvider } from './use-gpu-provider.hook';

describe('useGpuProvider Hook', () => {
    it('returns the value of the current gpu provider', async () => {
        const platformUtilsService = createInMemoryPlatformUtilsService();
        const { result } = renderHookWithProviders(() => useGpuProvider(), {
            providerProps: { platformUtilsService },
        });

        await waitFor(() => {
            expect(result.current).toBe(GPUProvider.INTEL);
        });
    });
});
