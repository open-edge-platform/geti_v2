// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

import { useLoadAIWebworker } from '../../../../hooks/use-load-ai-webworker/use-load-ai-webworker.hook';
import { useInferenceImage } from './use-inference-image.hook';

jest.mock('../../../../hooks/use-load-ai-webworker/use-load-ai-webworker.hook', () => ({
    useLoadAIWebworker: jest.fn(),
}));

describe('useInferenceImage', () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns resized image when worker is present', async () => {
        const mockResize = jest.fn().mockResolvedValue('resized-image');
        const mockInstance = { resize: mockResize };
        jest.mocked(useLoadAIWebworker).mockReturnValue({ worker: mockInstance });

        const { result } = renderHook(() => useInferenceImage(100, 200), { wrapper });

        const imageData = { foo: 'bar' } as unknown as ImageData;
        const output = await result.current(imageData);

        expect(mockResize).toHaveBeenCalledWith(imageData, 100, 200);
        expect(output).toBe('resized-image');
    });

    it('rejects if there is no worker', async () => {
        jest.mocked(useLoadAIWebworker).mockReturnValue({ worker: undefined });

        const { result } = renderHook(() => useInferenceImage(100, 200), { wrapper });

        await expect(result.current({} as ImageData)).rejects.toEqual('Unable to run inference mutation');
    });
});
