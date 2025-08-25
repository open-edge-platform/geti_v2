// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { useRef } from 'react';

import { ActionButton, CustomPopover, Flex, Text, View, ViewModes, type ActionButtonProps } from '@geti/ui';
import { Checkmark } from '@geti/ui/icons';
import { clsx } from 'clsx';
import { isEmpty } from 'lodash-es';
import { OverlayTriggerState, useOverlayTriggerState } from 'react-stately';

import { recursivelyAddLabel, recursivelyRemoveLabels } from '../../../core/labels/label-resolver';
import { Label } from '../../../core/labels/label.interface';
import { isAnomalyDomain } from '../../../core/projects/domains';
import { useTask } from '../../../pages/annotator/providers/task-provider/task-provider.component';
import { useProject } from '../../../pages/project-details/providers/project-provider/project-provider.component';
import { getForegroundColor, hexaToRGBA, isClassificationOrAnomaly } from '../../../pages/utils';
import { TaskLabelTreeSearch } from '../../../shared/components/task-label-tree-search/task-label-tree-search.component';
import { hasEqualId } from '../../../shared/utils';

import classes from './media-preview-list.module.scss';

interface LabelSelectorProps extends Omit<ActionButtonProps, 'isQuiet'> {
    title: string;
    labelIds: string[];
    viewMode?: ViewModes;
    hideLabelsName?: boolean;
    triggerState?: OverlayTriggerState;
    onSelectLabel: (data: Label[]) => void;
}

export const CondensedLabelSelector = ({
    title,
    labelIds,
    isDisabled,
    viewMode,
    triggerState,
    hideLabelsName = false,
    onSelectLabel,
    ...buttonStyles
}: LabelSelectorProps): JSX.Element => {
    const triggerRef = useRef(null);

    const { tasks } = useTask();
    const { isSingleDomainProject } = useProject();

    const localState = useOverlayTriggerState({});
    const isAnomalyProject = isSingleDomainProject(isAnomalyDomain);

    const [selectedTask] = tasks.filter(isClassificationOrAnomaly);
    const labelSelectorState = triggerState ?? localState;
    const taskLabels = selectedTask?.labels ?? [];

    const selectedLabel = taskLabels.find(hasEqualId(labelIds.at(-1)));
    const selectedLabels = taskLabels.filter((label) => labelIds.includes(label.id));
    const showTitle = isEmpty(selectedLabels) || !selectedLabel || hideLabelsName;

    const VIEW_MODE_TO_CLASSNAME: Record<ViewModes, string> = {
        [ViewModes.DETAILS]: classes.small,
        [ViewModes.SMALL]: classes.small,
        [ViewModes.MEDIUM]: classes.medium,
        [ViewModes.LARGE]: classes.large,
    };
    const viewModeClassName = viewMode ? VIEW_MODE_TO_CLASSNAME[viewMode] : '';
    const condensedModeSuffix =
        viewMode !== ViewModes.LARGE ? `(+${selectedLabels.length - 1})` : `(+${selectedLabels.length - 1} more)`;

    const selectedLabelButtonColor = selectedLabel
        ? getForegroundColor(
              hexaToRGBA(selectedLabel.color),
              'var(--spectrum-global-color-gray-50)',
              'var(--spectrum-global-color-gray-900)'
          )
        : undefined;

    const handleLabelClick = (label: Label) => {
        if (selectedLabels.some(hasEqualId(label.id))) {
            // For anomaly projects we want to disallow empty choice.
            // So if the user presses the label that is selected, we do nothing.
            if (isAnomalyProject && label.id === selectedLabel?.id) {
                labelSelectorState.close();

                return;
            }

            onSelectLabel([...recursivelyRemoveLabels(selectedLabels, [label])]);
        } else {
            onSelectLabel([...recursivelyAddLabel(selectedLabels, label, selectedTask?.labels)]);
        }

        labelSelectorState.close();
    };

    return (
        <>
            <Flex>
                {showTitle ? (
                    <ActionButton
                        isQuiet
                        ref={triggerRef}
                        {...buttonStyles}
                        id={'select-label-button-id'}
                        onPress={labelSelectorState.toggle}
                        isDisabled={isEmpty(selectedTask?.labels) || isDisabled}
                        UNSAFE_className={clsx(classes.labelSelectorButton, buttonStyles.UNSAFE_className)}
                        UNSAFE_style={{
                            color: 'var(--spectrum-actionbutton-quiet-text-color)',
                            background: 'var(--spectrum-global-color-gray-50)',
                            ...buttonStyles.UNSAFE_style,
                        }}
                    >
                        {title}
                    </ActionButton>
                ) : (
                    <ActionButton
                        isQuiet
                        key={selectedLabel.id}
                        id={`label-button-${selectedLabel.id}-id`}
                        ref={triggerRef}
                        {...buttonStyles}
                        onPress={labelSelectorState.toggle}
                        isDisabled={isEmpty(selectedTask?.labels) || isDisabled}
                        UNSAFE_className={clsx(
                            classes.labelSelectorButton,
                            buttonStyles.UNSAFE_className,
                            viewModeClassName ? viewModeClassName : ''
                        )}
                        UNSAFE_style={{
                            ...buttonStyles.UNSAFE_style,
                            color: selectedLabelButtonColor,
                            background: selectedLabel.color,
                        }}
                    >
                        <Text
                            UNSAFE_className={clsx(classes.condensedText, viewModeClassName ? viewModeClassName : '')}
                            data-suffix={condensedModeSuffix}
                        >
                            {selectedLabel.name}
                        </Text>
                        <Text UNSAFE_className={clsx(classes.suffix, viewModeClassName ? viewModeClassName : '')}>
                            {selectedLabels.length > 1 && `${condensedModeSuffix}`}
                        </Text>
                    </ActionButton>
                )}
            </Flex>

            <CustomPopover
                ref={triggerRef}
                state={labelSelectorState}
                placement={'bottom left'}
                UNSAFE_style={{ border: 'none' }}
            >
                <View padding={'size-100'} width={'size-4600'} maxHeight={'size-3600'} overflow={'auto'}>
                    <TaskLabelTreeSearch
                        tasks={tasks}
                        selectedTask={selectedTask}
                        includesEmptyLabels={false}
                        onClick={handleLabelClick}
                        suffix={(label) =>
                            labelIds.includes(label.id) && (
                                <Checkmark
                                    size='S'
                                    UNSAFE_style={{ color: 'var(--spectrum-alias-icon-color-selected)' }}
                                />
                            )
                        }
                    />
                </View>
            </CustomPopover>
        </>
    );
};
