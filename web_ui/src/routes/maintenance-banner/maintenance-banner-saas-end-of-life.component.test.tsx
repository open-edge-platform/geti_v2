// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { fireEvent, render, screen } from '@testing-library/react';

import { useIsSaasEnv } from '../../hooks/use-is-saas-env/use-is-saas-env.hook';
import { MaintenanceBannerSaaSEndOfLife } from './maintenance-banner-saas-end-of-life.component';

jest.mock('../../hooks/use-is-saas-env/use-is-saas-env.hook', () => ({
    useIsSaasEnv: jest.fn(),
}));

describe('MaintenanceBannerSaaSEndOfLife', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the banner when in SaaS environment', () => {
        jest.mocked(useIsSaasEnv).mockReturnValue(true);

        render(<MaintenanceBannerSaaSEndOfLife />);
        expect(screen.getByText(/Important update to Geti Cloud Trial/i)).toBeInTheDocument();
        expect(screen.getByText(/We are phasing out our cloud-based/i)).toBeInTheDocument();
    });

    it('does not render the banner when not in SaaS environment', () => {
        jest.mocked(useIsSaasEnv).mockReturnValue(false);

        render(<MaintenanceBannerSaaSEndOfLife />);
        expect(screen.queryByText(/Scheduled maintenance/i)).not.toBeInTheDocument();
    });

    it('hides the banner when dismiss button is clicked', () => {
        jest.mocked(useIsSaasEnv).mockReturnValue(true);

        render(<MaintenanceBannerSaaSEndOfLife />);
        const dismissButton = screen.getByLabelText(/dismiss banner/i);
        fireEvent.click(dismissButton);

        expect(screen.queryByText(/Scheduled maintenance/i)).not.toBeInTheDocument();
    });
});
