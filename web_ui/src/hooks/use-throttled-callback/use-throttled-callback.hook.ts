// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { throttle, type DebouncedFunc } from 'lodash-es';

export const useThrottledCallback = <Args extends unknown[]>(
    callback: (...args: Args) => void,
    delay: number
): DebouncedFunc<(...args: Args) => void> => {
    const savedCallback = useRef(callback);

    useLayoutEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    const debouncedCallback = useMemo(() => {
        // Same ref-proxy pattern as debounce: `throttle` keeps the initial function,
        // so we read from the ref to prevent stale callback invocations.
        return throttle((...args: Args) => savedCallback.current(...args), delay, {
            leading: true,
            trailing: true,
        });
    }, [delay]);

    useEffect(() => {
        return () => {
            debouncedCallback.cancel();
        };
    }, [debouncedCallback]);

    return debouncedCallback;
};
