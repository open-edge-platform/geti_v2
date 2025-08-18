// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ElementRef, ReactNode, useRef } from 'react';

import { useHover } from '@react-aria/interactions';
import { useOverlayTriggerState } from '@react-stately/overlays';
import { clsx } from 'clsx';

import { KeypointNode, Point } from '../../../../../core/annotations/shapes.interface';
import { CursorContextMenu } from './cursor-context-menu/cursor-context-menu.component';
import { HiddenEdge } from './hidden-edge.component';

import classes from './edge.module.scss';

export interface EdgeProps {
    id?: string;
    to: KeypointNode;
    from: KeypointNode;
    isSelected: boolean;
    isDisabled?: boolean;
    contextMenu?: ReactNode;
    onSelect: (isSelected: boolean) => void;
    onRemoveSelected: (id: string) => void;
    onResetAndSelect: (id: string[]) => void;
    onNewIntermediatePoint: (newPoint: Point, prevFrom: KeypointNode, prevTo: KeypointNode) => void;
}

const isHiddenEdge = (element: Element) => {
    return /^hidden padded edge/i.test(element.getAttribute('aria-label') ?? '');
};

const useContextMenuState = (isSelected: boolean) => {
    const state = useOverlayTriggerState({});

    if (state.isOpen && !isSelected) {
        state.setOpen(false);
    }

    return state;
};

export const Edge = ({
    id = '',
    to,
    from,
    isSelected,
    contextMenu,
    isDisabled = false,
    onSelect,
    onResetAndSelect,
    onNewIntermediatePoint,
}: EdgeProps) => {
    const triggerRef = useRef<ElementRef<'line'>>(null);
    const { hoverProps, isHovered } = useHover({});
    const state = useContextMenuState(isSelected);

    const position = { x1: from.x, y1: from.y, x2: to.x, y2: to.y };

    const handleOpen = () => {
        state.open();
        onResetAndSelect([id]);
    };

    return (
        <>
            <g
                ref={triggerRef}
                style={{ pointerEvents: isDisabled ? 'none' : 'auto' }}
                aria-label='edge container'
                {...hoverProps}
            >
                <line
                    aria-label={`line - ${from.label.name}`}
                    {...position}
                    style={{ stroke: from.label.color }}
                    className={clsx({
                        [classes.edge]: true,
                        [classes.selected]: isSelected,
                        [classes.secondLine]: true,
                    })}
                />

                <line
                    aria-label={`line - ${to.label.name}`}
                    {...position}
                    style={isSelected ? { stroke: to.label.color } : {}}
                    className={clsx({
                        [classes.edge]: true,
                        [classes.selected]: isSelected,
                        [classes.hovered]: isHovered,
                    })}
                />

                <HiddenEdge
                    to={to}
                    from={from}
                    isHovered={isHovered}
                    isSelected={isSelected}
                    onSelect={onSelect}
                    onNewIntermediatePoint={onNewIntermediatePoint}
                />
            </g>

            <CursorContextMenu state={state} triggerRef={triggerRef} onOpen={handleOpen} isValidTrigger={isHiddenEdge}>
                {contextMenu}
            </CursorContextMenu>
        </>
    );
};
