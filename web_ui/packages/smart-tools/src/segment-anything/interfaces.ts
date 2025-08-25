// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Shape } from '../shared/interfaces';

export interface SegmentAnythingResult {
    shapes: Shape[];
    areas: number[];
    maxContourIdx: number;
}
