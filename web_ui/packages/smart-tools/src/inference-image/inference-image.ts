// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import type OpenCVTypes from 'OpenCVTypes';

import { formatImageData } from '../utils/utils';

export class InferenceImage {
    constructor(private CV: OpenCVTypes.cv) {}

    resize(imageData: ImageData, width: number, height: number): ImageData {
        const img = this.getImage(imageData);

        const size = new this.CV.Size(width, height);
        const dst: OpenCVTypes.Mat = new this.CV.Mat();
        const colorMap: OpenCVTypes.Mat = new this.CV.Mat();

        this.CV.resize(img, dst, size, 0, 0, this.CV.INTER_CUBIC);
        this.CV.applyColorMap(dst, colorMap, this.CV.COLORMAP_JET);
        this.CV.cvtColor(colorMap, colorMap, this.CV.COLOR_BGR2RGB);

        const finalImageData = formatImageData(this.CV, colorMap);

        img.delete();
        dst.delete();
        colorMap.delete();

        return finalImageData;
    }

    getImage(imageData: ImageData): OpenCVTypes.Mat {
        const data = this.CV.matFromImageData(imageData);

        this.CV.cvtColor(data, data, this.CV.COLOR_RGBA2RGB, 0);

        return data;
    }
}
