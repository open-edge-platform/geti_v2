// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { screen } from '@testing-library/react';

import { DOMAIN } from '../../../core/projects/core.interface';
import { providersRender as render } from '../../../test-utils/required-providers-render';
import { DomainName } from './domain-name.component';

describe('DomainName', () => {
    const anomalyDomain = DOMAIN.ANOMALY_CLASSIFICATION;

    it('should render Anomaly detection domain', () => {
        render(<DomainName domain={anomalyDomain} />);
        expect(screen.getByText('Anomaly detection')).toBeInTheDocument();
    });

    it.each(Object.values(DOMAIN).filter((domain) => domain !== anomalyDomain))('should render %s domain', (domain) => {
        render(<DomainName domain={domain} />);

        expect(screen.getByText(domain)).toBeInTheDocument();
    });
});
