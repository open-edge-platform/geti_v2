// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { fireEvent, screen } from '@testing-library/react';

import { providersRender } from '../../../test-utils/required-providers-render';
import { DeleteItemButton } from './delete-item-button.component';

describe('DeleteItemButton', () => {
    const renderAp = async ({ id = 'test-id', onDeleteItem = jest.fn() }: { id?: string; onDeleteItem: jest.Mock }) => {
        providersRender(<DeleteItemButton id={id} onDeleteItem={onDeleteItem} />);
    };

    it('calls onDeleteItem', async () => {
        const mockedDelete = jest.fn();
        const mockedId = 'item-id';

        await renderAp({ id: mockedId, onDeleteItem: mockedDelete });

        fireEvent.click(screen.getByRole('button', { name: /delete/ }));

        fireEvent.click(await screen.findByRole('button', { name: /delete/i }));

        expect(mockedDelete).toHaveBeenCalledTimes(1);
    });
});
