// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Item, Loading, TabList, TabPanels, Tabs, Text } from '@geti/ui';
import { isEmpty } from 'lodash-es';

import { useTrainedModelConfigurationQuery } from '../../../../../../core/configurable-parameters/hooks/use-trained-model-configuration.hook';
import { TrainedModelConfiguration } from '../../../../../../core/configurable-parameters/services/configuration.interface';
import { useModelIdentifier } from '../../../../../../hooks/use-model-identifier/use-model-identifier.hook';
import { CustomerSupportLink } from '../../../../../../shared/components/customer-support-link/customer-support-link.component';
import { NotFound } from '../../../../../../shared/components/not-found/not-found.component';
import { AdvancedConfigurationParameters } from './advanced-configuration.component';
import { ModelDataManagementParameters } from './model-data-management-parameters.component';
import { ModelTrainingParameters } from './model-training-parameters.component';

import styles from './trained-model-configuration-parameters.module.scss';

interface TrainedModelConfigurationParametersListProps {
    parameters: TrainedModelConfiguration;
}

const TrainedModelConfigurationParametersList = ({ parameters }: TrainedModelConfigurationParametersListProps) => {
    const tabs = [
        {
            name: 'Data management',
            isVisible: !isEmpty(parameters.datasetPreparation.augmentation),
            children: <ModelDataManagementParameters parameters={parameters.datasetPreparation.augmentation} />,
        },
        {
            name: 'Training',
            isVisible: !isEmpty(parameters.training),
            children: <ModelTrainingParameters parameters={parameters.training} />,
        },
        {
            name: 'Evaluation',
            /**
             * Evaluation tab will be supported in the phase 2.
             */
            isVisible: false || !isEmpty(parameters.evaluation),
            children: undefined,
        },
        {
            name: 'Advanced',
            isVisible: !isEmpty(parameters.advancedConfiguration),
            children: <AdvancedConfigurationParameters parameters={parameters.advancedConfiguration} />,
        },
    ];

    const visibleTabs = tabs.filter((tab) => tab.isVisible);

    type TabItem = (typeof tabs)[number];

    return (
        <Tabs
            aria-label={'Trained model parameters list'}
            orientation={'vertical'}
            items={visibleTabs}
            UNSAFE_className={styles.tabs}
            marginTop={'size-100'}
            height={'100%'}
        >
            <TabList>
                {(item: TabItem) => (
                    <Item key={item.name} textValue={item.name}>
                        {item.name}
                    </Item>
                )}
            </TabList>
            <TabPanels>
                {(item: TabItem) => (
                    <Item key={item.name} textValue={item.name}>
                        {item.children}
                    </Item>
                )}
            </TabPanels>
        </Tabs>
    );
};

interface TrainedModelConfigurationParametersProps {
    taskId: string;
}

export const TrainedModelConfigurationParameters = ({ taskId }: TrainedModelConfigurationParametersProps) => {
    const { modelId, ...projectIdentifier } = useModelIdentifier();
    const { data, isPending } = useTrainedModelConfigurationQuery(projectIdentifier, { modelId, taskId });

    if (isPending) {
        return <Loading />;
    }

    if (data === undefined) {
        return (
            <NotFound
                heading={'Training Parameters Unavailable'}
                content={
                    <Text>
                        The model training parameters could not be loaded. Please try again or contact{' '}
                        <CustomerSupportLink />.
                    </Text>
                }
            />
        );
    }

    return <TrainedModelConfigurationParametersList parameters={data} />;
};
