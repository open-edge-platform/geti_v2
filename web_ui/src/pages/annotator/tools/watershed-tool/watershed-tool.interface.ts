// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { type Watershed } from '@geti/smart-tools';

import { Label } from '../../../../core/labels/label.interface';
import { AlgorithmType } from '../../../../hooks/use-load-ai-webworker/algorithm.interface';
import { WebWorker } from '../../../../webworkers/web-worker.interface';
import { Marker } from '../marker-tool/marker-tool.interface';

export interface WatershedWorker extends WebWorker {
    type: AlgorithmType.WATERSHED;
    build: () => Promise<Watershed>;
}

export interface RunWatershedProps {
    imageData: ImageData;
    markers: Marker[];
    sensitivity: number;
}

export interface WatershedLabel {
    markerId: number;
    label: Label;
}
