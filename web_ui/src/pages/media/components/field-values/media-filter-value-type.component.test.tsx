// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { screen } from '@testing-library/react';
import { User } from '@react-aria/test-utils';

import { providersRender as render } from '../../../../test-utils/required-providers-render';
import { simulateDesktop } from '../../../../test-utils/utils';
import { MEDIA_TYPE_OPTIONS } from '../../utils';
import { MediaFilterValueType } from './media-filter-value-type.component';

describe('MediaFilterValueType', () => {
    let user: User;
    const mockOnSelectionChange = jest.fn();

    beforeAll(() => {
        simulateDesktop();
    });

    beforeEach(() => {
        user = new User();
    });

    it('opens dropdown menu', async () => {
        render(<MediaFilterValueType value={1} onSelectionChange={mockOnSelectionChange} />);

        const selectTester = user.createTester('Select', {
            root: screen.getByLabelText('media-filter-media-type'),
        });

        await selectTester.open();
        expect(selectTester.options()).toHaveLength(MEDIA_TYPE_OPTIONS.length);
    });

    it('has correct types and triggers callback', async () => {
        render(<MediaFilterValueType value={1} onSelectionChange={mockOnSelectionChange} />);

        const selectTester = user.createTester('Select', {
            root: screen.getByLabelText('media-filter-media-type'),
        });

        await selectTester.open();
        expect(selectTester.options().map(option => option.textContent)).toEqual(
            MEDIA_TYPE_OPTIONS.map(option => option.text)
        );
        await selectTester.selectOption({ option: 'Image' });

        expect(mockOnSelectionChange).toHaveBeenCalledWith('IMAGE');
    });
});
