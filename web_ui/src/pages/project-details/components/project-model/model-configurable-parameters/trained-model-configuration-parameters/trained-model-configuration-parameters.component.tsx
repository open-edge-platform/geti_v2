// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Item, Loading, TabList, TabPanels, Tabs } from '@geti/ui';
import { isEmpty } from 'lodash-es';

import { useTrainedModelConfigurationQuery } from '../../../../../../core/configurable-parameters/hooks/use-trained-model-configuration.hook';
import { TrainedModelConfiguration } from '../../../../../../core/configurable-parameters/services/configuration.interface';
import { useModelIdentifier } from '../../../../../../hooks/use-model-identifier/use-model-identifier.hook';
import { Accordion } from '../../../project-models/train-model-dialog/advanced-settings/ui/accordion/accordion.component';

import styles from './trained-model-configuration-parameters.module.scss';

interface TrainedModelConfigurationParametersListProps {
    parameters: TrainedModelConfiguration;
}

const TrainingParameters = ({ parameters }: { parameters: TrainedModelConfiguration['training'] }) => {
    return (
        <Accordion>
            <Accordion.Title>Training Parameters</Accordion.Title>
            <Accordion.Content>
                <Accordion.Description>//</Accordion.Description>
                {/* Render specific training parameters here */}
            </Accordion.Content>
        </Accordion>
    );
};

const TrainedModelConfigurationParametersList = ({ parameters }: TrainedModelConfigurationParametersListProps) => {
    const tabs = [
        {
            name: 'Data management',
            isVisible: !isEmpty(parameters.datasetPreparation.augmentation),
            children: <>Data management</>,
        },
        {
            name: 'Training',
            isVisible: !isEmpty(parameters.training),
            children: <>Training</>,
        },
        {
            name: 'Evaluation',
            isVisible: !isEmpty(parameters.evaluation),
            children: <>Evaluation</>,
        },
        {
            name: 'Advanced',
            isVisible: !isEmpty(parameters.advancedConfiguration),
            children: <>Advanced</>,
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

    if (isPending || data === undefined) {
        return <Loading />;
    }

    return <TrainedModelConfigurationParametersList parameters={data} />;
};
