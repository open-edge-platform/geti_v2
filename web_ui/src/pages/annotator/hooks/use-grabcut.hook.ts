// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useRef } from 'react';

import { Grabcut, GrabcutData as ToolGrabcutData } from '@geti/smart-tools';
import { Polygon as ToolPolygon } from '@geti/smart-tools/types';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { Remote } from 'comlink';

import { Polygon } from '../../../core/annotations/shapes.interface';
import { AlgorithmType } from '../../../hooks/use-load-ai-webworker/algorithm.interface';
import { useLoadAIWebworker } from '../../../hooks/use-load-ai-webworker/use-load-ai-webworker.hook';
import { GrabcutToolType } from '../tools/grabcut-tool/grabcut-tool.enums';
import { GrabcutData } from '../tools/grabcut-tool/grabcut-tool.interface';
import { convertToolShapeToGetiShape } from '../tools/utils';

interface useGrabcutProps {
    onSuccess: (data: Polygon, variables: GrabcutData) => void;
    showNotificationError: (error: unknown) => void;
}

interface useGrabcutResult {
    cleanModels: () => void;
    isLoadingGrabcut: boolean;
    mutation: UseMutationResult<ToolPolygon, unknown, GrabcutData>;
}

const convertGetiDataToGrabcutData = (data: GrabcutData): ToolGrabcutData => {
    return {
        ...data,
        inOrder: data.activeTool === GrabcutToolType.ForegroundTool,
        inputRect: data.inputRect,
    };
};

export const useGrabcut = ({ showNotificationError, onSuccess }: useGrabcutProps): useGrabcutResult => {
    const { worker, isLoading } = useLoadAIWebworker(AlgorithmType.GRABCUT);
    const grabcutRef = useRef<Remote<Grabcut> | null>(null);

    useEffect(() => {
        return () => {
            cleanModels();
        };
    }, [worker]);

    const mutation = useMutation<ToolPolygon, unknown, GrabcutData>({
        mutationFn: async ({ image, ...data }: GrabcutData) => {
            if (worker) {
                await worker.loadImage(image);

                grabcutRef.current = worker;

                const convertedData: ToolGrabcutData = convertGetiDataToGrabcutData({ image, ...data });

                if (!grabcutRef.current) {
                    return Promise.reject(new Error('Could not run Grabcut'));
                }

                return grabcutRef.current.startGrabcut(convertedData);
            } else {
                return Promise.reject(new Error('Could not run Grabcut'));
            }
        },

        onError: showNotificationError,

        onSuccess: (data: ToolPolygon, variables: GrabcutData) => {
            const convertedPolygon = convertToolShapeToGetiShape(data);

            onSuccess(convertedPolygon, variables);
        },
    });

    const cleanModels = () => {
        if (grabcutRef.current) {
            grabcutRef.current.cleanModels();
        }

        grabcutRef.current = null;
    };

    return { mutation, isLoadingGrabcut: isLoading, cleanModels };
};
