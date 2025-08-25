// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { PointerEvent } from 'react';

import { Hotkeys } from '../../providers/annotator-provider/utils';
import { PolygonMode } from './polygon-tool.enum';

export const PolygonHotKeys: Pick<Hotkeys, PolygonMode.MagneticLasso> = {
    [PolygonMode.MagneticLasso]: 'shift+s',
};

export interface MouseEventHandlers {
    onPointerUp: (event: PointerEvent<SVGSVGElement>) => void;
    onPointerDown: (event: PointerEvent<SVGSVGElement>) => void;
    onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
}
