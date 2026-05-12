// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { render, screen } from '@testing-library/react';

import { ThinProgressBar, ThinProgressBarProps } from './thin-progress-bar.component';

describe('UploadStatusProgressBar', () => {
    it('renders an element with the correct styles based on props', () => {
        const testProps: ThinProgressBarProps = {
            progress: 0,
            size: 'size-50',
            color: 'blue-400',
            customColor: '',
            trackColor: 'gray-400',
        };

        render(<ThinProgressBar {...testProps} />);

        const bar = screen.getByTestId('thin-progress-bar');
        // The width is the only style that ends up inline; `size` and `color`
        // are forwarded to Spectrum's `View`, which renders them as CSS
        // variables / classes rather than inline styles.
        expect(bar).toHaveStyle({ width: `${testProps.progress}%` });
        expect(bar.style.height).toMatch(/--spectrum-global-dimension-size-50/);
    });
});
