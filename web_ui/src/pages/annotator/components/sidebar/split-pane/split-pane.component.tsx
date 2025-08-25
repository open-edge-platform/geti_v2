// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { clsx } from 'clsx';
import {
    Panel as ResizablePanel,
    PanelGroup as ResizablePanelGroup,
    PanelResizeHandle as ResizablePanelResizableHandle,
    type PanelGroupProps,
    type PanelProps,
    type PanelResizeHandleProps,
} from 'react-resizable-panels';

import styles from './split-pane.module.scss';

export const Panel = (props: PanelProps) => {
    return <ResizablePanel {...props} />;
};

export const PanelGroup = (props: PanelGroupProps) => {
    return <ResizablePanelGroup {...props} />;
};

export const PanelResizeHandle = ({ className, ...rest }: PanelResizeHandleProps) => {
    return <ResizablePanelResizableHandle className={clsx(styles.handle, className)} {...rest} />;
};
