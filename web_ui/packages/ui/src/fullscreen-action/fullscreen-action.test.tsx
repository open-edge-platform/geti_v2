// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode } from 'react';

import { darkTheme, Provider } from '@adobe/react-spectrum';
import { fireEvent, render, screen } from '@testing-library/react';

import { FullscreenAction } from './fullscreen-action.component';

const ThemeProvider = ({ children }: { children: ReactNode }) => {
    return <Provider theme={darkTheme}>{children}</Provider>;
};

describe('Fullscreen action', () => {
    it('Check if action opens and closes fullscreen', async () => {
        render(
            <ThemeProvider>
                <FullscreenAction title={'Test fullscreen'}>
                    <div data-testid={'test-fullscreen'} />
                </FullscreenAction>
            </ThemeProvider>
        );

        expect(screen.queryByTestId('test-fullscreen')).not.toBeInTheDocument();
        const expandButton = screen.getByRole('button', { name: /Open in fullscreen/ });
        fireEvent.click(expandButton);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();

        expect(screen.getByText('Test fullscreen')).toBeInTheDocument();
        expect(screen.getByTestId('test-fullscreen')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Close fullscreen' }));
        expect(dialog).not.toBeInTheDocument();
    });

    it('renders custom actionButton in the dialog', () => {
        render(
            <ThemeProvider>
                <FullscreenAction title='With Action' actionButton={<button aria-label='custom-action'>Custom</button>}>
                    <div />
                </FullscreenAction>
            </ThemeProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: /Open in fullscreen With Action/ }));
        expect(screen.getByLabelText('custom-action')).toBeInTheDocument();
    });
});
