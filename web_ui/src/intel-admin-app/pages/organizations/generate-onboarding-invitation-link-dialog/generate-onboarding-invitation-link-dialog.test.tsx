// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { createInMemoryOnboardingService } from '@geti/core/src/users/services/inmemory-onboarding-service';
import { getLocalTimeZone, today } from '@internationalized/date';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { providersRender as render } from '../../../../test-utils/required-providers-render';
import { GenerateOnboardingTokenDialogContainer } from './generate-onboarding-invitation-link-dialog.component';

const mockCopy = jest.fn();

jest.mock('../../../../hooks/use-clipboard/use-clipboard.hook', () => ({
    useClipboard: jest.fn(() => ({ copy: mockCopy })),
}));

describe('GenerateOnboardingTokenDialog', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should generate token and allow user to copy it', async () => {
        // jsdom's default origin is `http://localhost` and `window.location` is
        // not configurable in jsdom >= 24 (Jest 30), so we rely on the default
        // origin instead of stubbing it.
        const originUrl = window.location.origin;
        const token = 'cool-token';
        const link = `${originUrl}?signup-token=${token}`;

        const onboardingService = createInMemoryOnboardingService();
        onboardingService.generateToken = jest.fn(() => Promise.resolve({ onboardingToken: token }));

        render(<GenerateOnboardingTokenDialogContainer />, { services: { onboardingService } });

        fireEvent.click(screen.getByRole('button', { name: 'Create invitation link' }));

        expect(screen.getByRole('heading', { name: 'Create invitation link' })).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

        expect(await screen.findByRole('heading', { name: 'Copy invitation link' })).toBeVisible();
        expect(screen.getByText(link)).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: /Copy/ }));

        expect(mockCopy).toHaveBeenCalledWith(link, 'Onboarding invitation link copied successfully');
    });

    it('should generate tok with default dates range equal to 30 days', async () => {
        const todayDate = today(getLocalTimeZone());
        const endDate = todayDate.add({ days: 30 }).toString();

        const onboardingService = createInMemoryOnboardingService();
        onboardingService.generateToken = jest.fn(() => Promise.resolve({ onboardingToken: 'token' }));

        render(<GenerateOnboardingTokenDialogContainer />, { services: { onboardingService } });

        fireEvent.click(screen.getByRole('button', { name: 'Create invitation link' }));

        expect(screen.getByRole('heading', { name: 'Create invitation link' })).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

        await waitFor(() => {
            expect(onboardingService.generateToken).toHaveBeenCalledWith({
                dateFrom: todayDate.toString(),
                dateTo: endDate.toString(),
            });
        });
    });

    it('should show error notification message when token generation fails', async () => {
        const errorMessage = 'Token generation failed';
        const onboardingService = createInMemoryOnboardingService();
        onboardingService.generateToken = jest.fn(() => Promise.reject({ message: errorMessage }));

        render(<GenerateOnboardingTokenDialogContainer />, { services: { onboardingService } });

        fireEvent.click(screen.getByRole('button', { name: 'Create invitation link' }));

        expect(screen.getByRole('heading', { name: 'Create invitation link' })).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

        await waitFor(() => {
            expect(onboardingService.generateToken).toHaveBeenCalled();
        });

        expect(screen.getByText(errorMessage)).toBeVisible();
    });
});
