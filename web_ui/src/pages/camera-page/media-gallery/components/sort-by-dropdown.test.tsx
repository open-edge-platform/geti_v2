// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { defaultTheme, Provider } from '@geti/ui';
import { fireEvent, render, screen } from '@testing-library/react';

import { SortingOptions } from '../../util';
import { SortByDropdown } from './sort-by-dropdown.component';
import { simulateDesktop } from '../../../../test-utils/utils';

describe('SortByDropdown', () => {
    beforeAll(() => {
        simulateDesktop();
    });

    it('"Most Recent" is selected by default', () => {
        const mockedOnSelect = jest.fn();

        render(
            <Provider theme={defaultTheme}>
                <SortByDropdown onSelect={mockedOnSelect} />
            </Provider>
        );

        expect(screen.getByRole('button', { name: 'Most Recent sorting options' })).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'Most Recent sorting options' }));
        fireEvent.click(screen.getByRole('option', { name: 'Label Name (A-Z)' }));

        expect(mockedOnSelect).toHaveBeenCalledWith(SortingOptions.LABEL_NAME_A_Z);
    });
});
