// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { PointerEvent, SVGProps } from 'react';

interface MouseButton {
    button: number;
    buttons: number;
}

const BUTTON_LEFT = {
    button: 0,
    buttons: 1,
};
const BUTTON_WHEEL = {
    button: 1,
    buttons: 4,
};

const isButton = (button: MouseButton, buttonToCompare: MouseButton): boolean =>
    button.button === buttonToCompare.button || button.buttons === buttonToCompare.buttons;

export const isLeftButton = (button: MouseButton): boolean => {
    return button.button === BUTTON_LEFT.button || button.buttons === BUTTON_LEFT.buttons;
};

export const isWheelButton = (button: MouseButton): boolean => {
    return isButton(button, BUTTON_WHEEL);
};

type OnPointerDown = SVGProps<SVGElement>['onPointerDown'];
export const allowPanning = (onPointerDown?: OnPointerDown): OnPointerDown | undefined => {
    if (onPointerDown === undefined) {
        return;
    }

    return (event: PointerEvent<SVGElement>) => {
        const isPressingPanningHotKeys = (isLeftButton(event) && event.ctrlKey) || isWheelButton(event);

        if (isPressingPanningHotKeys) {
            return;
        }

        return onPointerDown(event);
    };
};
