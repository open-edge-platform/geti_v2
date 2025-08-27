// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { screen, waitFor } from '@testing-library/react';

import { providersRender } from '../../../../test-utils/required-providers-render';
import { PermissionError } from './permissions-error.component';

describe('PermissionError', () => {
    const renderApp = () => {
        providersRender(<PermissionError />);
    };

    it('render toast', async () => {
        renderApp();

        await waitFor(() => {
            expect(screen.getByText('Camera connection is lost')).toBeVisible();
            expect(screen.getByText('Please check your device and network settings and try again.')).toBeVisible();
        });
    });
});
