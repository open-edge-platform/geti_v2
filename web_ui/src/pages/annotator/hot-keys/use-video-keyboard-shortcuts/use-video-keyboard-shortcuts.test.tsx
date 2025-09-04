// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode } from 'react';

import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { renderHookWithProviders } from '../../../../test-utils/render-hook-with-providers';
import { getMockedVideoControls } from '../../components/video-player/video-controls/test-utils';
import { AnnotatorProviders } from '../../test-utils/annotator-render';
import { useVideoKeyboardShortcuts } from './use-video-keyboard-shortcuts';

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: () => jest.fn(),
}));

const wrapper = ({ children }: { children: ReactNode }) => {
    const datasetIdentifier = {
        workspaceId: 'workspace-id',
        projectId: 'project-id',
        datasetId: 'dataset-id',
        organizationId: 'organization-id',
    };

    return <AnnotatorProviders datasetIdentifier={datasetIdentifier}>{children}</AnnotatorProviders>;
};

const renderVideoKeyboardShortcuts = async (mockedVideoControls: ReturnType<typeof getMockedVideoControls>) => {
    const result = renderHookWithProviders(() => useVideoKeyboardShortcuts(mockedVideoControls), { wrapper });

    await waitForElementToBeRemoved(screen.getByRole('progressbar'));

    return result;
};

describe('useVideoKeyboardShortcuts', () => {
    it('should invoke play callback correctly', async () => {
        const mockedVideoControls = getMockedVideoControls({});
        await renderVideoKeyboardShortcuts(mockedVideoControls);

        await userEvent.keyboard('k');

        await waitFor(() => {
            expect(mockedVideoControls.play).toHaveBeenCalled();
        });
    });

    it('should invoke pause callback correctly', async () => {
        const mockedVideoControls = getMockedVideoControls({ isPlaying: true });
        await renderVideoKeyboardShortcuts(mockedVideoControls);

        await userEvent.keyboard('k');

        await waitFor(() => {
            expect(mockedVideoControls.pause).toHaveBeenCalled();
        });
    });

    it('should invoke nextFrame callback correctly', async () => {
        const mockedVideoControls = getMockedVideoControls({ canSelectNext: true });
        await renderVideoKeyboardShortcuts(mockedVideoControls);

        await userEvent.keyboard('{arrowright}');

        await waitFor(() => {
            expect(mockedVideoControls.next).toHaveBeenCalled();
        });
    });

    it('should invoke previousFrame callback correctly', async () => {
        const mockedVideoControls = getMockedVideoControls({ canSelectPrevious: true });
        await renderVideoKeyboardShortcuts(mockedVideoControls);

        await userEvent.keyboard('{arrowleft}');

        await waitFor(() => {
            expect(mockedVideoControls.previous).toHaveBeenCalled();
        });
    });

    it('should not invoke callbacks in case of a negative condition', async () => {
        const mockedVideoControls = getMockedVideoControls({
            canSelectPrevious: false,
            canSelectNext: false,
            isPlaying: false,
        });
        await renderVideoKeyboardShortcuts(mockedVideoControls);

        await userEvent.keyboard('k');

        await waitFor(() => {
            expect(mockedVideoControls.pause).not.toHaveBeenCalled();
            expect(mockedVideoControls.play).toHaveBeenCalled();
        });

        await userEvent.keyboard('{arrowleft}');
        expect(mockedVideoControls.previous).not.toHaveBeenCalled();

        await userEvent.keyboard('{arrowright}');
        expect(mockedVideoControls.next).not.toHaveBeenCalled();
    });
});
