// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useRef, useState } from 'react';

import { RITM } from '@geti/smart-tools/ritm';
import { Shape as SmartToolsShape } from '@geti/smart-tools/types';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { Remote } from 'comlink';

import { AlgorithmType } from '../../../hooks/use-load-ai-webworker/algorithm.interface';
import { useLoadAIWebworker } from '../../../hooks/use-load-ai-webworker/use-load-ai-webworker.hook';
import { useAnnotationScene } from '../providers/annotation-scene-provider/annotation-scene-provider.component';
import { RITMData, RITMResult } from '../tools/ritm-tool/ritm-tool.interface';
import { convertToolShapeToGetiShape } from '../tools/utils';

interface useInteractiveSegmentationProps {
    onSuccess: (result: RITMResult) => void;
    showNotificationError: (error: unknown) => void;
}

interface useInteractiveSegmentationResult {
    cleanMask: () => void;
    reset: () => void;
    loadImage: RITM['loadImage'];
    isLoading: boolean;
    mutation: UseMutationResult<SmartToolsShape | undefined, unknown, RITMData>;
    cancel: () => void;
}

export const useInteractiveSegmentation = ({
    showNotificationError,
    onSuccess,
}: useInteractiveSegmentationProps): useInteractiveSegmentationResult => {
    const { setIsDrawing } = useAnnotationScene();

    const { worker } = useLoadAIWebworker(AlgorithmType.RITM);

    const ritmInstance = useRef<Remote<RITM> | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const cancelRequested = useRef<boolean>(false);

    const cancel = () => {
        cancelRequested.current = true;
    };

    useEffect(() => {
        const loadWorker = async () => {
            if (worker) {
                ritmInstance.current = worker;

                await ritmInstance.current?.load();

                setIsLoading(false);
            }
        };

        if (worker) {
            loadWorker();
        }
    }, [worker]);

    useEffect(() => {
        return () => setIsDrawing(false);
    }, [setIsDrawing]);

    const mutation = useMutation<SmartToolsShape | undefined, unknown, RITMData>({
        mutationFn: ({ area, givenPoints, outputShape }: RITMData) => {
            if (!ritmInstance.current) {
                throw 'Interactive segmentation not ready yet';
            }

            cancelRequested.current = false;
            setIsDrawing(true);

            return ritmInstance.current.execute(area, givenPoints, outputShape);
        },

        onError: showNotificationError,

        onSuccess: (shape, { givenPoints }: RITMData) => {
            if (cancelRequested.current) {
                return;
            }

            onSuccess({
                points: givenPoints,
                shape: shape ? convertToolShapeToGetiShape(shape) : undefined,
            });
        },
    });

    const cleanMask = () => {
        ritmInstance?.current?.resetPointMask();
    };

    const reset = () => {
        setIsDrawing(false);
        ritmInstance?.current?.reset();
    };

    const loadImage = (imageData: ImageData) => {
        if (!ritmInstance.current) {
            console.warn('loading image before RITM is loaded...');

            return;
        }

        reset();
        ritmInstance.current.loadImage(imageData);
    };

    return {
        cleanMask,
        reset,
        isLoading,
        loadImage,
        mutation,
        cancel,
    };
};
