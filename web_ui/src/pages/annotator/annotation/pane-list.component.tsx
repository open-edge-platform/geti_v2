// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import React, { ReactNode } from 'react';

import { Panel, PanelGroup, PanelResizeHandle } from '../components/sidebar/split-pane/split-pane.component';

interface PaneListProps {
    itemsList: ReactNode;
    listActions: ReactNode;
    thumbnailGrid?: ReactNode;
}

export const PaneList = ({ itemsList, listActions, thumbnailGrid = null }: PaneListProps) => {
    return (
        <PanelGroup direction={'vertical'}>
            {thumbnailGrid && (
                <>
                    <Panel minSize={5} order={1}>
                        {thumbnailGrid}
                    </Panel>
                    <PanelResizeHandle />
                </>
            )}

            <Panel minSize={5} order={2}>
                <div style={{ height: 'calc(100% - var(--spectrum-global-dimension-size-675))' }}>
                    {listActions}
                    {itemsList}
                </div>
            </Panel>
        </PanelGroup>
    );
};
