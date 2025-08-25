// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode, useRef } from 'react';

import { useOverlayTriggerState } from '@react-stately/overlays';
import { fireEvent, render, screen } from '@testing-library/react';

import { CursorContextMenu } from './cursor-context-menu.component';

describe('CursorContextMenu', () => {
    const renderApp = ({
        onOpen = jest.fn(),
        isValidTrigger = jest.fn(),
        isOpen = false,
        children = <div>Menu Content</div>,
    }: {
        onOpen?: () => void;
        isValidTrigger?: (element: Element) => boolean;
        isOpen?: boolean;
        children?: ReactNode;
    }) => {
        const App = () => {
            const triggerRef = useRef<HTMLButtonElement>(null);
            const state = useOverlayTriggerState({
                isOpen,
            });

            return (
                <div data-testid='modal' style={{ position: 'relative' }}>
                    <button ref={triggerRef}>trigger</button>
                    <CursorContextMenu
                        onOpen={onOpen}
                        state={state}
                        isValidTrigger={isValidTrigger}
                        triggerRef={triggerRef}
                    >
                        {children}
                    </CursorContextMenu>
                </div>
            );
        };
        render(<App />);
    };

    it('should not render the menu when isOpen is false', () => {
        renderApp({ isOpen: false });
        expect(screen.queryByText('Menu Content')).not.toBeInTheDocument();
    });

    it('should not open the menu if isValidTrigger returns false', () => {
        const mockOnOpen = jest.fn();
        renderApp({ isOpen: false, onOpen: mockOnOpen, isValidTrigger: () => false });

        const triggerElement = screen.getByRole('button', { name: 'trigger' });
        fireEvent.contextMenu(triggerElement, { clientX: 100, clientY: 150 });

        expect(mockOnOpen).not.toHaveBeenCalled();
    });
});
