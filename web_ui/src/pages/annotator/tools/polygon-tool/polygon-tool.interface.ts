// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { PointerEvent } from 'react';

import { IntelligentScissors } from '@geti/smart-tools';

import { AlgorithmType } from '../../../../hooks/use-load-ai-webworker/algorithm.interface';
import { WebWorker } from '../../../../webworkers/web-worker.interface';
import { Hotkeys } from '../../providers/annotator-provider/utils';
import { PolygonMode } from './polygon-tool.enum';

export interface IntelligentScissorsWorker extends WebWorker {
    type: AlgorithmType.INTELLIGENT_SCISSORS;
    build: () => Promise<IntelligentScissors>;
}

export const PolygonHotKeys: Pick<Hotkeys, PolygonMode.MagneticLasso> = {
    [PolygonMode.MagneticLasso]: 'shift+s',
};

export interface MouseEventHandlers {
    onPointerUp: (event: PointerEvent<SVGSVGElement>) => void;
    onPointerDown: (event: PointerEvent<SVGSVGElement>) => void;
    onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
}
