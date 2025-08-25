// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { screen, waitForElementToBeRemoved } from '@testing-library/react';

import { getMockedKeypointNode } from '../../../../test-utils/mocked-items-factory/mocked-keypoint';
import { getMockedLabel } from '../../../../test-utils/mocked-items-factory/mocked-labels';
import { AnnotationSceneProvider } from '../../providers/annotation-scene-provider/annotation-scene-provider.component';
import { annotatorRender } from '../../test-utils/annotator-render';
import { TransformZoomAnnotation } from '../../zoom/transform-zoom-annotation.component';
import { ZoomProvider } from '../../zoom/zoom-provider.component';
import { PoseKeypointProps, PoseKeypointVisibility } from './pose-keypoints.component';

describe('PoseKeypointVisibility', () => {
    const mockedVisiblePoint = getMockedKeypointNode({
        label: getMockedLabel({ name: 'visible point' }),
        isVisible: true,
    });
    const mockedHiddenPoint = getMockedKeypointNode({
        label: getMockedLabel({ name: 'hidden point' }),
        isVisible: false,
    });

    const renderApp = async ({
        point = getMockedKeypointNode(),
        visibility = 0,
        onChange = jest.fn(),
    }: Partial<PoseKeypointProps>) => {
        annotatorRender(
            <svg>
                <AnnotationSceneProvider annotations={[]} labels={[]}>
                    <ZoomProvider>
                        <TransformZoomAnnotation>
                            <PoseKeypointVisibility point={point} visibility={visibility} onChange={onChange} />
                        </TransformZoomAnnotation>
                    </ZoomProvider>
                </AnnotationSceneProvider>
            </svg>
        );

        await waitForElementToBeRemoved(screen.getByRole('progressbar'));
    };

    it('display visibility icon for visible keypoints', async () => {
        await renderApp({ point: mockedVisiblePoint });

        expect(screen.getByTestId('point-icon')).toBeVisible();
        expect(screen.queryByTestId('close-bold-icon')).not.toBeInTheDocument();
    });

    it('display close-bold icon for hidden keypoints', async () => {
        await renderApp({ point: mockedHiddenPoint });

        expect(screen.getByTestId('close-bold-icon')).toBeVisible();
        expect(screen.queryByTestId('point-icon')).not.toBeInTheDocument();
    });
});
