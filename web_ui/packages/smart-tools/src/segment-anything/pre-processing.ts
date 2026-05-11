// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Tensor } from 'onnxruntime-web';

import type { OpenCVTypes } from '../opencv/interfaces';

interface PreprocessorResult {
    tensor: Tensor;
    newWidth: number;
    newHeight: number;
}

export interface OpenCVPreprocessorConfig {
    normalize: {
        mean?: number[];
        std?: number[];
    };
    resize: boolean;
    size: number;
    squareImage: boolean;
    pad: boolean;
    padSize: number;
}

export class OpenCVPreprocessor {
    constructor(
        private CV: OpenCVTypes.cv,
        private config: OpenCVPreprocessorConfig
    ) {}

    public process(initialImageData: ImageData): PreprocessorResult {
        const mat = this.loadImage(initialImageData);
        let blob: OpenCVTypes.Mat | null = null;
        try {
            const { newWidth, newHeight } = this.resizeAndPad(mat);

            mat.convertTo(mat, this.CV.CV_32F, 1 / 255);
            this.normalize(mat);

            blob = this.CV.blobFromImage(mat);
            if (!blob) {
                throw new Error('Something went wrong with preprocessing the image.');
            }

            // `blob.data32F` is a view into WASM memory owned by `blob`, which is freed in the
            // `finally` block below. `session.run()` uploads the tensor data asynchronously
            // (especially on the WebGPU EP), so we must copy into JS-owned memory.
            const data = new Float32Array(blob.data32F);
            const tensor = new Tensor('float32', data, [1, 3, this.config.size, this.config.size]);

            return { tensor, newWidth, newHeight };
        } finally {
            mat.delete();
            blob?.delete();
        }
    }

    private loadImage(imageData: ImageData): OpenCVTypes.Mat {
        const src = this.CV.matFromImageData(imageData);
        // Strip the alpha channel — the ORT tensor only wants 3 channels.
        this.CV.cvtColor(src, src, this.CV.COLOR_RGBA2RGB, 0);
        return src;
    }

    private resizeAndPad(mat: OpenCVTypes.Mat): { newWidth: number; newHeight: number } {
        const { resize, squareImage, pad, padSize, size } = this.config;

        if (resize) {
            const [w, h] = squareImage
                ? [size, size]
                : mat.cols > mat.rows
                  ? [size, Math.ceil(mat.rows * (size / mat.cols))]
                  : [Math.ceil(mat.cols * (size / mat.rows)), size];
            this.CV.resize(mat, mat, new this.CV.Size(w, h), 0, 0, this.CV.INTER_LANCZOS4);
        }

        const newWidth = mat.cols;
        const newHeight = mat.rows;

        if (pad) {
            this.CV.copyMakeBorder(
                mat,
                mat,
                0,
                padSize - newHeight,
                0,
                padSize - newWidth,
                this.CV.BORDER_CONSTANT,
                new this.CV.Scalar(0, 0, 0, 0)
            );
        }

        return { newWidth, newHeight };
    }

    private normalize(dst: OpenCVTypes.Mat): void {
        const { mean, std } = this.config.normalize;
        if (mean) this.applyScalar(dst, mean, 'subtract');
        if (std) this.applyScalar(dst, std, 'divide');
    }

    private applyScalar(dst: OpenCVTypes.Mat, [c0, c1, c2]: number[], op: 'subtract' | 'divide'): void {
        const constant = dst.clone();
        try {
            constant.setTo(new this.CV.Scalar(c0, c1, c2));
            if (op === 'subtract') {
                this.CV.subtract(dst, constant, dst);
            } else {
                this.CV.divide(dst, constant, dst, 1);
            }
        } finally {
            constant.delete();
        }
    }
}
