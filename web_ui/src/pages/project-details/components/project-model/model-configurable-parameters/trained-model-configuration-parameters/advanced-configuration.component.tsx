// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Fragment } from 'react';

import { Grid } from '@geti/ui';

import { TrainedModelConfiguration } from '../../../../../../core/configurable-parameters/services/configuration.interface';
import { Accordion } from '../../../project-models/train-model-dialog/advanced-settings/ui/accordion/accordion.component';
import {
    ParameterName,
    ParameterReadOnlyValue,
} from '../../../project-models/train-model-dialog/advanced-settings/ui/parameters.component';

interface AdvancedConfigurationParametersProps {
    parameters: TrainedModelConfiguration['advancedConfiguration'];
}

export const AdvancedConfigurationParameters = ({ parameters }: AdvancedConfigurationParametersProps) => {
    return (
        <Accordion>
            <Accordion.Title>Advanced</Accordion.Title>
            <Accordion.Content>
                <Grid columns={['size-3000', '1fr']} gap={'size-300'}>
                    {parameters.map((parameter) => (
                        <Fragment key={parameter.key}>
                            <ParameterName name={parameter.name} description={parameter.description} />
                            <ParameterReadOnlyValue name={parameter.name} value={parameter.value} />
                        </Fragment>
                    ))}
                </Grid>
            </Accordion.Content>
        </Accordion>
    );
};
