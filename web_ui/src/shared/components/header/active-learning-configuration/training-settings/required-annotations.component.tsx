// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC, useState } from 'react';

import { NumberField } from '@geti/ui';

import { NumberGroupParams } from '../../../../../core/configurable-parameters/services/configurable-parameters.interface';
import { NumberParameter } from '../../../../../core/configurable-parameters/services/configuration.interface';
import { useDebouncedCallback } from '../../../../../hooks/use-debounced-callback/use-debounced-callback.hook';

interface RequiredAnnotationsProps {
    requiredImagesAutoTrainingConfig: NumberGroupParams | NumberParameter;
    onUpdateRequiredAnnotations: (newNumberOfRequiredAnnotations: number) => void;
}

export const RequiredAnnotations: FC<RequiredAnnotationsProps> = ({
    requiredImagesAutoTrainingConfig,
    onUpdateRequiredAnnotations,
}) => {
    const [numberOfRequiredAnnotations, setNumberOfRequiredAnnotations] = useState<number>(
        requiredImagesAutoTrainingConfig.value
    );

    const debouncedOnUpdateRequiredAnnotations = useDebouncedCallback(onUpdateRequiredAnnotations, 300);

    const handleRequiredAnnotationsChange = (value: number): void => {
        setNumberOfRequiredAnnotations(value);
        debouncedOnUpdateRequiredAnnotations(value);
    };

    return (
        <NumberField
            step={1}
            value={numberOfRequiredAnnotations}
            minValue={requiredImagesAutoTrainingConfig.minValue}
            maxValue={requiredImagesAutoTrainingConfig.maxValue ?? undefined}
            onChange={handleRequiredAnnotationsChange}
            label={'Number of required annotations'}
            isQuiet={false}
        />
    );
};
