// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { toast } from '@geti/ui';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useApplicationServices } from '../../services/application-services-provider.component';
import { getErrorMessage } from '../../services/utils';
import {
    GenerateOnboardingTokenParams,
    GenerateOnboardingTokenResponse,
} from '../services/onboarding-service.interface';

export const useGenerateOnboardingTokenMutation = () => {
    const { onboardingService } = useApplicationServices();

    return useMutation<GenerateOnboardingTokenResponse, AxiosError, GenerateOnboardingTokenParams>({
        mutationFn: onboardingService.generateToken,
        onError: (error) => {
            toast({ message: getErrorMessage(error), type: 'error' });
        },
    });
};
