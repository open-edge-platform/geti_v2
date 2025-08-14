// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode, RefObject, useRef, useState } from 'react';

import { View } from '@geti/ui';
import { useOverlay } from 'react-aria';
import { createPortal } from 'react-dom';
import { OverlayTriggerState } from 'react-stately';

import { useEventListener } from '../../../../../../hooks/event-listener/event-listener.hook';
import { MouseEvents } from '../../../../../../shared/mouse-events';

export interface CursorContextMenuProps {
    state: OverlayTriggerState;
    children: ReactNode;
    onOpen: () => void;
    isValidTrigger: (element: Element) => boolean;
    triggerRef: RefObject<Element>;
}

export const X_PADDING = 10;

const getParentModal = () => {
    return document.querySelector('[data-testid="modal"]');
};

export const CursorContextMenu = ({ state, children, triggerRef, onOpen, isValidTrigger }: CursorContextMenuProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

    useEventListener(
        MouseEvents.ContextMenu,
        (event) => {
            event.preventDefault();

            const parentModal = getParentModal();

            if (isValidTrigger(event.target as Element)) {
                if (parentModal === null) return;

                const modalBox = parentModal.getBoundingClientRect();

                onOpen();
                setCursorPosition({ x: event.clientX - modalBox.x + X_PADDING, y: event.clientY - modalBox.y });
            }
        },
        triggerRef
    );

    const { overlayProps } = useOverlay(
        {
            isOpen: state.isOpen,
            isDismissable: true,
            shouldCloseOnBlur: false,
            onClose: state.close,
        },
        ref
    );

    if (!state.isOpen) return null;

    return createPortal(
        <div ref={ref} {...overlayProps}>
            <View
                position={'absolute'}
                top={cursorPosition.y}
                left={cursorPosition.x}
                zIndex={100001}
                backgroundColor={'gray-200'}
                data-testid='position container'
                {...overlayProps}
            >
                {children}
            </View>
        </div>,
        getParentModal() as HTMLElement
    );
};
