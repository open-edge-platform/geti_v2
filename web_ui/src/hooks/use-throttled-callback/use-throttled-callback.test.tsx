// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { act, renderHook } from '@testing-library/react';

import { useThrottledCallback } from './use-throttled-callback.hook';

describe('useThrottledCallback', () => {
    it('executes a given callback after given delay', () => {
        jest.useFakeTimers();

        const mockCallback = jest.fn();
        const delay = 1000;
        const { result } = renderHook(() => useThrottledCallback(mockCallback, delay));

        act(() => {
            result.current();
        });

        expect(mockCallback).toHaveBeenCalledTimes(1);

        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('calls the latest callback for trailing invocation after rerender', () => {
        jest.useFakeTimers();

        const firstCallback = jest.fn();
        const secondCallback = jest.fn();
        const delay = 1000;

        const { result, rerender } = renderHook(
            ({ callback }) => useThrottledCallback(callback, delay),
            {
                initialProps: { callback: firstCallback },
            }
        );

        act(() => {
            result.current('first');
        });

        expect(firstCallback).toHaveBeenCalledTimes(1);
        expect(firstCallback).toHaveBeenCalledWith('first');

        rerender({ callback: secondCallback });

        act(() => {
            result.current('second');
            jest.advanceTimersByTime(delay);
        });

        expect(firstCallback).toHaveBeenCalledTimes(1);
        expect(secondCallback).toHaveBeenCalledTimes(1);
        expect(secondCallback).toHaveBeenCalledWith('second');

        jest.clearAllTimers();
        jest.useRealTimers();
    });
});
