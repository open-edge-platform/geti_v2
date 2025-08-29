// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { DOMAIN } from '../../../core/projects/core.interface';
import { isAnomalyDomain } from '../../../core/projects/domains';

interface DomainNameProps {
    domain: DOMAIN;
}

export const DomainName = ({ domain }: DomainNameProps) => {
    if (isAnomalyDomain(domain)) {
        return <>{DOMAIN.ANOMALY_DETECTION}</>;
    }

    return <>{domain}</>;
};
