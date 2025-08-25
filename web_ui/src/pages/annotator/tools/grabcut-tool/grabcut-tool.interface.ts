// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Point, Rect } from '../../../../core/annotations/shapes.interface';
import { Hotkeys } from '../../providers/annotator-provider/utils';
import { GrabcutToolType } from './grabcut-tool.enums';

export interface GrabcutData {
    inputRect: Rect;
    strokeWidth: number;
    sensitivity: number;
    foreground: Point[][];
    background: Point[][];
    image: ImageData;
    activeTool: GrabcutToolType;
}

export const GrabcutHotKeys: Pick<Hotkeys, GrabcutToolType> = {
    [GrabcutToolType.InputTool]: 'g',
    [GrabcutToolType.ForegroundTool]: 'shift',
    [GrabcutToolType.BackgroundTool]: 'alt',
};
