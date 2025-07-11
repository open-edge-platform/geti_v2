// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { FC, Key, useState } from 'react';

import { ActionButton, Flex, Icon, Item, Menu, MenuTrigger, Text, View } from '@geti/ui';
import { SortDown, SortUp, SortUpDown } from '@geti/ui/icons';
import { orderBy } from 'lodash-es';
import { Section } from 'react-stately';

import { SupportedAlgorithm } from '../../../../../../../core/supported-algorithms/supported-algorithms.interface';
import { ModelArchitecturesMainContent } from './model-architectures-main-content.component';
import { SortingOptions } from './utils';

type SortingHandler = (templates: SupportedAlgorithm[]) => SupportedAlgorithm[];

const sortingHandlers: Record<SortingOptions, SortingHandler> = {
    [SortingOptions.RELEVANCE_DESC]: (templates) =>
        orderBy(templates, (algorithm) => algorithm.isDefaultAlgorithm, 'desc'),
    [SortingOptions.RELEVANCE_ASC]: (templates) =>
        orderBy(templates, (algorithm) => algorithm.isDefaultAlgorithm, 'asc'),
    [SortingOptions.NUMBER_OF_PARAMETERS_ASC]: (templates) =>
        orderBy(templates, (algorithm) => algorithm.trainableParameters, 'asc'),
    [SortingOptions.NUMBER_OF_PARAMETERS_DESC]: (templates) =>
        orderBy(templates, (algorithm) => algorithm.trainableParameters, 'desc'),
    [SortingOptions.COMPLEXITY_ASC]: (templates) => orderBy(templates, (algorithm) => algorithm.gigaflops, 'asc'),
    [SortingOptions.COMPLEXITY_DESC]: (templates) => orderBy(templates, (algorithm) => algorithm.gigaflops, 'desc'),
};

interface SortArchitecturesPickerProps {
    sortBy: SortingOptions;
    onSort: (option: SortingOptions) => void;
}

const SortArchitecturesPicker: FC<SortArchitecturesPickerProps> = ({ sortBy, onSort }) => {
    return (
        <MenuTrigger>
            <ActionButton isQuiet aria-label={'Sort architectures'}>
                <SortUpDown />
            </ActionButton>
            <Menu
                selectionMode={'single'}
                onAction={(key: Key) => onSort(key as SortingOptions)}
                defaultSelectedKeys={[sortBy]}
            >
                <Section>
                    <Item key={SortingOptions.RELEVANCE_ASC} textValue={SortingOptions.RELEVANCE_ASC}>
                        <Text>Relevance</Text>
                        <Icon>
                            <SortUp />
                        </Icon>
                    </Item>
                    <Item key={SortingOptions.RELEVANCE_DESC} textValue={SortingOptions.RELEVANCE_DESC}>
                        <Text>Relevance</Text>
                        <Icon>
                            <SortDown />
                        </Icon>
                    </Item>
                </Section>
                <Section>
                    <Item
                        key={SortingOptions.NUMBER_OF_PARAMETERS_ASC}
                        textValue={SortingOptions.NUMBER_OF_PARAMETERS_ASC}
                    >
                        <Text>Number of parameters</Text>
                        <Icon>
                            <SortUp />
                        </Icon>
                    </Item>
                    <Item
                        key={SortingOptions.NUMBER_OF_PARAMETERS_DESC}
                        textValue={SortingOptions.NUMBER_OF_PARAMETERS_DESC}
                    >
                        <Text>Number of parameters</Text>
                        <Icon>
                            <SortDown />
                        </Icon>
                    </Item>
                </Section>
                <Section>
                    <Item key={SortingOptions.COMPLEXITY_ASC} textValue={SortingOptions.COMPLEXITY_ASC}>
                        <Text>Complexity</Text>
                        <Icon>
                            <SortUp />
                        </Icon>
                    </Item>
                    <Item key={SortingOptions.COMPLEXITY_DESC} textValue={SortingOptions.COMPLEXITY_DESC}>
                        <Text>Complexity</Text>
                        <Icon>
                            <SortDown />
                        </Icon>
                    </Item>
                </Section>
            </Menu>
        </MenuTrigger>
    );
};

interface ModelArchitecturesProps {
    algorithms: SupportedAlgorithm[];
    selectedModelTemplateId: string | null;
    onChangeSelectedTemplateId: (modelTemplateId: string | null) => void;
    activeModelTemplateId: string | null;
}

export const ModelArchitectures: FC<ModelArchitecturesProps> = ({
    algorithms,
    selectedModelTemplateId,
    onChangeSelectedTemplateId,
    activeModelTemplateId,
}) => {
    const [sortBy, setSortBy] = useState<SortingOptions>(SortingOptions.RELEVANCE_DESC);
    const sortedAlgorithms = sortingHandlers[sortBy](algorithms);

    return (
        <View>
            <Flex direction={'row-reverse'}>
                <SortArchitecturesPicker onSort={setSortBy} sortBy={sortBy} />
            </Flex>
            <ModelArchitecturesMainContent
                algorithms={sortedAlgorithms}
                selectedModelTemplateId={selectedModelTemplateId}
                onChangeSelectedTemplateId={onChangeSelectedTemplateId}
                activeModelTemplateId={activeModelTemplateId}
                sortBy={sortBy}
            />
        </View>
    );
};
