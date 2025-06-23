// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ActionButton, Tooltip, TooltipTrigger } from '@geti/ui';
import { SortDown, SortUp } from '@geti/ui/icons';

import { ReorderType } from '../../../../../core/labels/label-tree-view.interface';
import { MenuButtonProps } from './menu-button.interface';

interface ReorderMenuButtonProps extends MenuButtonProps {
    type: ReorderType;
    isEnabled: boolean;
}

export const ReorderMenuButton = ({ action, id, type, isEnabled }: ReorderMenuButtonProps): JSX.Element => {
    const reorderButtonId = `reorder-${type}-label-button`;

    return (
        <TooltipTrigger placement={'bottom'}>
            <ActionButton
                isQuiet
                key={reorderButtonId}
                onPress={action}
                data-testid={`${id}-${reorderButtonId}`}
                aria-label={`reorder ${type} label button`}
                isDisabled={!isEnabled}
            >
                {type === 'up' ? (
                    <SortUp aria-label={'reorder up'} width={'16px'} height={'16px'} />
                ) : (
                    <SortDown aria-label={'reorder down'} width={'16px'} height={'16px'} />
                )}
            </ActionButton>
            <Tooltip>Move {type}</Tooltip>
        </TooltipTrigger>
    );
};
