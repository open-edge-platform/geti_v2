// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { RefObject, useCallback } from 'react';

import { type DOMRefValue } from '@geti/ui';

import { useEventListener } from '../event-listener/event-listener.hook';

interface OutsideClickProps {
    ref: RefObject<HTMLElement | null>;
    callback: (e: PointerEvent) => void;
    element?: RefObject<Element | null>;
}

export const useOutsideClick = ({ ref, callback, element }: OutsideClickProps): void => {
    const outsideClickHandler = useCallback(
        (event: PointerEvent) => {
            if (!ref.current) return;

            try {
                if (!ref.current.contains(event.target as Node)) callback(event);
            } catch (_) {
                if (
                    !(ref.current as unknown as DOMRefValue<HTMLDivElement>)
                        .UNSAFE_getDOMNode()
                        ?.contains(event.target as Node)
                ) {
                    callback(event);
                }
            }
        },
        [ref, callback]
    );

    useEventListener('pointerdown', outsideClickHandler, element);
};
