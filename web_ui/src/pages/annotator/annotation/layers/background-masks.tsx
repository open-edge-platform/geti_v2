// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Annotation } from '../../../../core/annotations/annotation.interface';
import { ShapeFactory } from '../shapes/factory.component';

interface BackgroundMasksProps {
    id: string;
    annotations: Annotation[];
}

export const BackgroundMasks = ({ id, annotations }: BackgroundMasksProps) => {
    return (
        <defs xmlns='http://www.w3.org/2000/svg'>
            <mask id={id} aria-label='background-mask'>
                <rect width='100%' height='100%' fill='white' />
                <g fill='black' fillOpacity='1'>
                    {annotations.map((annotation) => (
                        <ShapeFactory key={annotation.id} annotation={annotation} />
                    ))}
                </g>
            </mask>
        </defs>
    );
};
