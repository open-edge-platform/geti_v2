// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useEffect, useState } from 'react';

import { useFeatureFlags } from '@geti/core/src/feature-flags/hooks/use-feature-flags.hook';
import { useApplicationServices } from '@geti/core/src/services/application-services-provider.component';
import { toast } from '@geti/ui';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import QUERY_KEYS from '../../../../packages/core/src/requests/query-keys';
import { useOrganizationIdentifier } from '../../../hooks/use-organization-identifier/use-organization-identifier.hook';
import { StatusProps } from '../status.interface';
import {
    isBelowLowFreeDiskSpace,
    isBelowTooLowFreeDiskSpace,
    LOW_FREE_DISK_SPACE_MESSAGE,
    TOO_LOW_FREE_DISK_SPACE_MESSAGE,
} from './utils';

export const useStatus = (): UseQueryResult<StatusProps, AxiosError> => {
    const { organizationId } = useOrganizationIdentifier();
    const { FEATURE_FLAG_STORAGE_SIZE_COMPUTATION } = useFeatureFlags();

    const [isTooLowOpenOnce, setIsTooLowOpenOnce] = useState(true);
    const [isLowOpenOnce, setIsLowOpenOnce] = useState(true);
    const { statusService: service } = useApplicationServices();

    const statusQuery = useQuery<StatusProps, AxiosError>({
        queryKey: QUERY_KEYS.STATUS_KEY(),
        queryFn: () => {
            return service.getStatus(organizationId);
        },
        notifyOnChangeProps: ['data', 'error'],
    });

    useEffect(() => {
        if (!statusQuery.isSuccess) {
            return;
        }

        if (!FEATURE_FLAG_STORAGE_SIZE_COMPUTATION) {
            return;
        }

        if (isBelowTooLowFreeDiskSpace(statusQuery.data.freeSpace)) {
            if (isTooLowOpenOnce) {
                toast({
                    message: TOO_LOW_FREE_DISK_SPACE_MESSAGE,
                    type: 'error',
                    duration: Infinity,
                });

                setIsTooLowOpenOnce(false);
            }

            return;
        }

        if (isBelowLowFreeDiskSpace(statusQuery.data.freeSpace)) {
            if (isLowOpenOnce) {
                toast({
                    message: LOW_FREE_DISK_SPACE_MESSAGE,
                    type: 'warning',
                    duration: Infinity,
                });
                setIsLowOpenOnce(false);
            }

            return;
        }
    }, [
        statusQuery.isSuccess,
        statusQuery.data,
        FEATURE_FLAG_STORAGE_SIZE_COMPUTATION,
        setIsLowOpenOnce,
        isLowOpenOnce,
        isTooLowOpenOnce,
    ]);

    return statusQuery;
};
