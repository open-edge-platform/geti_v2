// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useOverlayTriggerState } from 'react-stately';

import { getMockedScreenshot } from '../../../test-utils/mocked-items-factory/mocked-camera';
import { providersRender } from '../../../test-utils/required-providers-render';
import { ImageOverlay } from './image-overlay.component';
import { FileItem } from './util';

const screenshotOne = getMockedScreenshot({ id: '1' });
const screenshotTwo = getMockedScreenshot({ id: '2' });

describe('ImageOverlay', () => {
    const renderAp = async ({
        defaultIndex = 0,
        items = [],
        mockedDelete = jest.fn(),
    }: {
        defaultIndex?: number;
        items?: FileItem[];
        mockedDelete?: jest.Mock;
    }) => {
        const StateImageOverlay = () => {
            const state = useOverlayTriggerState({});
            return (
                <>
                    <ImageOverlay
                        items={items}
                        onDeleteItem={mockedDelete}
                        defaultIndex={defaultIndex}
                        dialogState={state}
                    />
                    <button onClick={state.toggle}>open overlay</button>
                </>
            );
        };

        return providersRender(<StateImageOverlay />);
    };

    it('empty items', async () => {
        await renderAp({ items: [] });
        fireEvent.click(await screen.findByRole('button', { name: /open overlay/i }));

        expect(screen.queryByRole('button', { name: 'close preview' })).not.toBeInTheDocument();
    });

    it('single item, navigation options are hidden', async () => {
        await renderAp({ items: [screenshotOne] });
        fireEvent.click(await screen.findByRole('button', { name: /open overlay/i }));

        expect(screen.getByRole('img', { name: `full screen screenshot ${screenshotOne.id}` })).toBeVisible();

        expect(screen.queryByRole('button', { name: /next item/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /next item/i })).not.toBeInTheDocument();
    });

    it('calls onDelete', async () => {
        const mockedDelete = jest.fn();
        await renderAp({ items: [screenshotOne], mockedDelete });
        fireEvent.click(await screen.findByRole('button', { name: /open overlay/i }));

        fireEvent.click(screen.getByRole('button', { name: /delete/i }));
        fireEvent.click(await screen.findByRole('button', { name: /delete/i }));

        expect(mockedDelete).toHaveBeenCalledWith(screenshotOne.id);
    });

    it('close preview', async () => {
        await renderAp({ items: [screenshotOne] });

        fireEvent.click(await screen.findByRole('button', { name: /open overlay/i }));
        fireEvent.click(await screen.findByRole('button', { name: /close preview/i }));

        await waitFor(() => {
            expect(screen.queryByRole('button', { name: /close preview/i })).not.toBeInTheDocument();
        });
    });

    describe('multiple items', () => {
        const mockedScreenshot = [screenshotOne, screenshotTwo];

        it('gets back to the first item', async () => {
            await renderAp({ items: mockedScreenshot });
            fireEvent.click(await screen.findByRole('button', { name: /open overlay/i }));

            expect(screen.getByRole('img', { name: `full screen screenshot ${screenshotOne.id}` })).toBeVisible();

            fireEvent.click(screen.getByRole('button', { name: /next item/i }));
            expect(screen.getByRole('img', { name: `full screen screenshot ${screenshotTwo.id}` })).toBeVisible();

            fireEvent.click(screen.getByRole('button', { name: /next item/i }));
            expect(screen.getByRole('img', { name: `full screen screenshot ${screenshotOne.id}` })).toBeVisible();
        });

        it('moves to the last item', async () => {
            await renderAp({ items: mockedScreenshot });
            fireEvent.click(await screen.findByRole('button', { name: /open overlay/i }));

            expect(screen.getByRole('img', { name: `full screen screenshot ${screenshotOne.id}` })).toBeVisible();

            fireEvent.click(screen.getByRole('button', { name: /previous item/i }));
            expect(screen.getByRole('img', { name: `full screen screenshot ${screenshotTwo.id}` })).toBeVisible();

            fireEvent.click(screen.getByRole('button', { name: /previous item/i }));
            expect(screen.getByRole('img', { name: `full screen screenshot ${screenshotOne.id}` })).toBeVisible();
        });
    });
});
