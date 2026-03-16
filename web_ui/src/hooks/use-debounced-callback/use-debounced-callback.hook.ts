// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { debounce, type DebouncedFunc } from 'lodash-es';

export const useDebouncedCallback = <Args extends unknown[]>(
    callback: (...args: Args) => void,
    delay: number
): DebouncedFunc<(...args: Args) => void> => {
    const savedCallback = useRef(callback);

    useLayoutEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    const debouncedCallback = useMemo(() => {
        return debounce((...args: Args) => savedCallback.current(...args), delay);
    }, [delay]);

    useEffect(() => {
        return () => {
            debouncedCallback.cancel();
        };
    }, [debouncedCallback]);

    return debouncedCallback;
};
