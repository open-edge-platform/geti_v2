// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Item, Loading, TabList, TabPanels, Tabs } from '@geti/ui';
import { isEmpty } from 'lodash-es';

import { useTrainedModelConfigurationQuery } from '../../../../../../core/configurable-parameters/hooks/use-trained-model-configuration.hook';
import { TrainedModelConfiguration } from '../../../../../../core/configurable-parameters/services/configuration.interface';
import { isConfigurationParameter } from '../../../../../../core/configurable-parameters/utils';
import { useModelIdentifier } from '../../../../../../hooks/use-model-identifier/use-model-identifier.hook';
import { LearningParametersList } from '../../../project-models/train-model-dialog/advanced-settings/training/learning-parameters/learning-parameters-list.component';
import { Accordion } from '../../../project-models/train-model-dialog/advanced-settings/ui/accordion/accordion.component';

import styles from './trained-model-configuration-parameters.module.scss';

interface TrainedModelConfigurationParametersListProps {
    parameters: TrainedModelConfiguration;
}

const isLearningParameterModified = (parameters: TrainedModelConfiguration['training']): boolean => {
    return !parameters.every((parameter) => {
        if (isConfigurationParameter(parameter)) {
            return parameter.defaultValue === parameter.value;
        }

        return Object.values(parameter).every((subParameter) => {
            return subParameter.every((subSubParameter) => {
                return subSubParameter.defaultValue === subSubParameter.value;
            });
        });
    });
};

const TrainingParameters = ({ parameters }: { parameters: TrainedModelConfiguration['training'] }) => {
    const tag = isLearningParameterModified(parameters) ? 'Modified' : 'Default';

    return (
        <Accordion>
            <Accordion.Title>
                Learning parameters
                <Accordion.Tag>{tag}</Accordion.Tag>
            </Accordion.Title>
            <Accordion.Content>
                <LearningParametersList isReadOnly parameters={parameters} />
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
            children: <TrainingParameters parameters={parameters.training} />,
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
