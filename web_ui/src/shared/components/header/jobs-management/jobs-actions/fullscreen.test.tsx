// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { fireEvent, render, screen } from '@testing-library/react';

import { Fullscreen } from './fullscreen.component';

describe('job scheduler fullscreen', (): void => {
    it('should properly render collapse button', (): void => {
        render(<Fullscreen enabled toggle={jest.fn()} />);

        expect(screen.getByTestId('job-scheduler-action-collapse')).toBeInTheDocument();
    });

    it('should properly render expand button', (): void => {
        render(<Fullscreen enabled={false} toggle={jest.fn()} />);

        expect(screen.getByTestId('job-scheduler-action-expand')).toBeInTheDocument();
    });

    it('should trigger toggle callback on press event', (): void => {
        const onToggle = jest.fn((innerFunction) => {
            expect(innerFunction(true)).toBe(false);
            expect(innerFunction(false)).toBe(true);
        });

        render(<Fullscreen enabled toggle={onToggle} />);
        fireEvent.click(screen.getByTestId('job-scheduler-action-collapse'));
        expect(onToggle).toHaveBeenCalledWith(expect.any(Function));
    });
});
