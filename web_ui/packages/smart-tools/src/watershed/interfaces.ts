// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Point } from '../shared/interfaces';

export interface WatershedPolygon {
    id: number;
    label: { id: string };
    points: Point[];
}

export type Marker = {
    id: number;
    label: { id: string };
    points: Point[];
};

export interface WatershedInstance {
    executeWatershed: (markers: Marker[], sensitivity: number) => WatershedPolygon[];
    drawMarkers: (markers: Marker[]) => void;
    getPolygons: (markers: Marker[]) => WatershedPolygon[];
    scaleImage: (sensitivity: number) => void;
    clearMemory: () => void;
}
