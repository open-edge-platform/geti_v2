// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { OpenCVTypes } from '../opencv/interfaces';
import { Rect, RegionOfInterest, Vector } from '../shared/interfaces';
import { OpenCVLoader } from '../utils/opencv-loader';
import { Match, RunSSIMProps, SSIMMatch } from './interfaces';

const SSIMScale: Vector = { x: 250, y: 250 };
const MINIMUM_THRESHOLD = 0.7;

class SSIM {
    constructor(private CV: OpenCVTypes.cv) {}

    buildImage(imageData: ImageData, roi: RegionOfInterest): { image: OpenCVTypes.Mat; scaleFactor: Vector } {
        const image = new this.CV.Mat();
        const originalImage = this.CV.matFromImageData(imageData);
        const imageSection = originalImage.roi(new this.CV.Rect(roi.x, roi.y, roi.width, roi.height));

        this.CV.cvtColor(imageSection, imageSection, this.CV.COLOR_RGBA2RGB, 0);
        this.CV.resize(imageSection, image, new this.CV.Size(SSIMScale.x, SSIMScale.y), 0, 0, this.CV.INTER_AREA);

        const scaleFactor = { x: SSIMScale.x / imageSection.cols, y: SSIMScale.y / imageSection.rows };
        originalImage.delete();
        imageSection.delete();

        return { image, scaleFactor };
    }

    runSSIM(image: OpenCVTypes.Mat, scaleFactor: Vector, templateArea: Rect): { probabilityImage: OpenCVTypes.Mat } {
        const mask = new this.CV.Mat();
        const probabilityImage = new this.CV.Mat();
        const template = image.roi(
            new this.CV.Rect(
                templateArea.x * scaleFactor.x,
                templateArea.y * scaleFactor.y,
                templateArea.width * scaleFactor.x,
                templateArea.height * scaleFactor.y
            )
        );

        this.CV.matchTemplate(image, template, probabilityImage, this.CV.TM_CCORR_NORMED, mask);
        this.CV.normalize(probabilityImage, probabilityImage, 0, 1, this.CV.NORM_MINMAX, this.CV.CV_64FC1);

        mask.delete();
        template.delete();

        return { probabilityImage };
    }

    getMatches(
        probabilityImage: OpenCVTypes.Mat,
        scaleFactor: Vector,
        templateArea: Rect,
        roi: RegionOfInterest
    ): SSIMMatch[] {
        const items: Match[] = [];
        const offset = { x: 0.5, y: 0.5 };

        for (let y = 0; y < probabilityImage.rows; y++) {
            for (let x = 0; x < probabilityImage.cols; x++) {
                const value = probabilityImage.doubleAt(y, x);

                if (value > MINIMUM_THRESHOLD) {
                    items.push({
                        x: (x + offset.x) / scaleFactor.x,
                        y: (y + offset.y) / scaleFactor.y,
                        value,
                    });
                }
            }
        }

        items.sort((a, b) => b.value - a.value);

        return items.map((match: Match) => {
            return {
                shape: { ...templateArea, x: match.x + roi.x, y: match.y + roi.y },
                confidence: match.value,
            };
        });
    }

    executeSSIM({ imageData, template, roi }: RunSSIMProps): SSIMMatch[] {
        let image, scaleFactor, probabilityImage;
        let results: SSIMMatch[] = [];

        try {
            ({ image, scaleFactor } = this.buildImage(imageData, roi));
            ({ probabilityImage } = this.runSSIM(image, scaleFactor, template));
            results = this.getMatches(probabilityImage, scaleFactor, template, roi);
        } catch (error) {
            console.warn('Something went wrong while trying to execute SSIM.\n Error: ', error);
        } finally {
            image?.delete();
            probabilityImage?.delete();
        }

        return results;
    }

    terminate() {
        self.close();
    }
}

const buildSSIMInstance = async (): Promise<SSIM> => {
    const opencv = await OpenCVLoader();

    return new SSIM(opencv);
};

export { buildSSIMInstance, SSIM };
