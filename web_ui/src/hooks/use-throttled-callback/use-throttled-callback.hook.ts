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
