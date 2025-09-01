// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useRef, useState } from 'react';

import { isEqual } from 'lodash-es';
import { TransformWrapper, useControls, useTransformContext, useTransformEffect } from 'react-zoom-pan-pinch';

import { Rect } from '../../../core/annotations/shapes.interface';
import { usePrevious } from '../../../hooks/use-previous/use-previous.hook';
import { MissingProviderError } from '../../../shared/missing-provider-error';
import { getCenterCoordinates } from './utils';

export type ZoomTarget = Omit<Rect, 'shapeType'> | undefined;

interface ZoomState {
    zoom: number;
    translation: {
        x: number;
        y: number;
    };
}

interface ZoomContextProps {
    setScreenSize: Dispatch<SetStateAction<{ width: number; height: number } | undefined>>;

    zoomTarget: ZoomTarget;
    setZoomTarget: Dispatch<SetStateAction<ZoomTarget>>;

    // we disable the double click to zoom out only when we are using pen
    isDblClickDisabled: boolean;
    setisDblClickDisabled: (disabled: boolean) => void;

    isPanning: boolean;
    isPanningDisabled: boolean;
    setIsPanningDisabled: (disabled: boolean) => void;

    setIsZoomDisabled: Dispatch<SetStateAction<boolean>>;
}

interface ZoomProviderProps {
    children: ReactNode;
}

const defaultZoomState: ZoomState = {
    zoom: 1.0,
    translation: { x: 0, y: 0 },
};

const ZoomContext = createContext<ZoomContextProps | undefined>(undefined);
const ZoomStateContext = createContext<ZoomState | undefined>(undefined);

interface ResetInitialZoomProps {
    initialZoomState: ZoomState;
}

// The goal of this component is to override the initial props that are passed to the TransformWrapper component.
// TransformWrapper does not change the props when initialZoomState changes. This component fixes that behaviour.
const ResetInitialZoom = ({ initialZoomState }: ResetInitialZoomProps) => {
    const { setTransform } = useControls();

    const previousInitialState = usePrevious(initialZoomState);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (isEqual(initialZoomState, previousInitialState)) {
            return;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        const {
            translation: { x, y },
            zoom,
        } = initialZoomState;

        timeoutRef.current = setTimeout(() => {
            setTransform(x, y, zoom);
            timeoutRef.current = null;
        }, 0);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialZoomState, previousInitialState]);

    return <></>;
};

const ZoomStateProvider = ({ children }: ZoomProviderProps) => {
    const [_, setX] = useState(0);
    const { transformState } = useTransformContext();

    // `useTransformContext` will not rerender when react-zoom-pan-pinch changes its
    // zoom state, so we force a rerender via its useTransformEffect
    useTransformEffect(() => {
        setX((x) => x + 1);
    });

    const zoomState = {
        zoom: transformState.scale,
        translation: {
            x: transformState.positionX,
            y: transformState.positionY,
        },
    };

    return <ZoomStateContext.Provider value={zoomState}>{children}</ZoomStateContext.Provider>;
};

const getInitialZoomState = (
    target: ZoomTarget,
    screenSize: { width: number; height: number } | undefined
): ZoomState => {
    if (!screenSize || !target) {
        return defaultZoomState;
    }
    const { scale, x, y } = getCenterCoordinates(screenSize, target);

    return { translation: { x, y }, zoom: scale };
};

export const ZoomProvider = ({ children }: ZoomProviderProps) => {
    const [isZoomDisabled, setIsZoomDisabled] = useState<boolean>(false);
    const [isPanningDisabled, setIsPanningDisabled] = useState<boolean>(true);
    const [isPanning, setIsPanning] = useState<boolean>(false);
    const [isDblClickDisabled, setisDblClickDisabled] = useState<boolean>(false);

    const [zoomTarget, setZoomTarget] = useState<ZoomTarget>();
    const [screenSize, setScreenSize] = useState<{ width: number; height: number } | undefined>();

    const initialZoomState = getInitialZoomState(zoomTarget, screenSize);

    // Allow the user to zoom out twice as much as the original zoom
    const minScale = Math.min(1, initialZoomState.zoom / 2);

    // Allow the user to zoom in so that they can see 25 individual pixels
    const maxScale = Math.round(Math.max(screenSize?.height ?? 1, screenSize?.width ?? 1) / 25);

    const value: ZoomContextProps = {
        zoomTarget,
        setZoomTarget,
        setScreenSize,

        isPanning,
        isPanningDisabled,
        setIsPanningDisabled,

        isDblClickDisabled,
        setisDblClickDisabled,
        setIsZoomDisabled,
    };

    return (
        <TransformWrapper
            disabled={isZoomDisabled}
            panning={{
                disabled: isPanningDisabled,
                velocityDisabled: true,
            }}
            smooth
            // Decrease to allow more zooming out
            minScale={minScale}
            maxScale={maxScale}
            initialScale={initialZoomState.zoom}
            initialPositionX={initialZoomState.translation.x}
            initialPositionY={initialZoomState.translation.y}
            onPanningStart={() => setIsPanning(true)}
            onPanningStop={() => setIsPanning(false)}
            limitToBounds={false}
            doubleClick={{ mode: 'reset', disabled: isDblClickDisabled }}
        >
            <ZoomContext.Provider value={value}>
                <ZoomStateProvider>{children}</ZoomStateProvider>
                <ResetInitialZoom initialZoomState={initialZoomState} />
            </ZoomContext.Provider>
        </TransformWrapper>
    );
};

export const useZoom = (): ZoomContextProps => {
    const context = useContext(ZoomContext);

    if (context === undefined) {
        throw new MissingProviderError('useZoom', 'ZoomProvider');
    }

    return context;
};

export const useZoomState = (): ZoomState => {
    const zoomStateContext = useContext(ZoomStateContext);

    if (zoomStateContext === undefined) {
        throw new MissingProviderError('useZoomState', 'ZoomStateProvider');
    }

    return zoomStateContext;
};
