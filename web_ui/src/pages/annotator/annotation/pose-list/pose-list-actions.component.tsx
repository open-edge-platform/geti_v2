// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ActionButton, Checkbox, dimensionValue, Flex, Tooltip, TooltipTrigger } from '@geti/ui';
import { CloseSemiBold, EyeSolid } from '@geti/ui/icons';
import { isEmpty } from 'lodash-es';

import { KeypointAnnotation } from '../../../../core/annotations/annotation.interface';
import { KeypointNode } from '../../../../core/annotations/shapes.interface';
import { ShapeType } from '../../../../core/annotations/shapetype.enum';
import { useSelected } from '../../../../providers/selected-provider/selected-provider.component';
import { useAnnotatorMode } from '../../hooks/use-annotator-mode';
import { useIsSceneBusy } from '../../hooks/use-annotator-scene-interaction-state.hook';
import { useDeleteKeyboardShortcut } from '../../hot-keys/use-delete-keyboard-shortcut/use-delete-keyboard-shortcut';
import { useToggleSelectAllKeyboardShortcut } from '../../hot-keys/use-toggle-select-all-keyboard-shortcut/use-toggle-select-all-keyboard-shortcut';
import { useAnnotationScene } from '../../providers/annotation-scene-provider/annotation-scene-provider.component';
import { blurActiveInput } from '../../tools/utils';

interface PoseListActionsProps {
    keypointAnnotation: KeypointAnnotation;
}

export const OCCLUDE_TOOLTIP = 'Mark all as occluded';
export const VISIBLE_TOOLTIP = 'Mark all as visible';

const DESELECT_TOOLTIP = 'Deselect all points';
const SELECT_TOOLTIP = 'Select all points';

const getLabelId = ({ label }: KeypointNode) => label.id;

export const PoseListActions = ({ keypointAnnotation }: PoseListActionsProps) => {
    const isSceneBusy = useIsSceneBusy();
    const { updateAnnotation, removeAnnotations, hasShapePointSelected } = useAnnotationScene();
    const { isActiveLearningMode } = useAnnotatorMode();
    const { isSelected, setSelected } = useSelected();

    const selectedPoints = keypointAnnotation.shape.points.filter(({ label }) => isSelected(label.id));
    const isEverythingVisible = selectedPoints.every(({ isVisible }) => isVisible);
    const hasSelectedPoints = !isEmpty(selectedPoints);

    const selectionTooltipText = hasSelectedPoints ? DESELECT_TOOLTIP : SELECT_TOOLTIP;
    const visibilityTooltipText = isEverythingVisible ? OCCLUDE_TOOLTIP : VISIBLE_TOOLTIP;
    const ToggleAllIcon = isEverythingVisible ? CloseSemiBold : EyeSolid;

    const selectAllPointsAriaLabel = `
    ${selectedPoints.length} out of ${keypointAnnotation.shape.points.length} points selected`;

    const handleSelectAllToggle = (isSelectAll: boolean) => {
        const selectedIds = isSelectAll ? keypointAnnotation.shape.points.map(getLabelId) : [];
        setSelected(selectedIds);
    };

    const handleSelectedVisibilityToggle = () => {
        updateAnnotation({
            ...keypointAnnotation,
            shape: {
                shapeType: ShapeType.Pose,
                points: keypointAnnotation.shape.points.map((point) =>
                    isSelected(point.label.id) ? { ...point, isVisible: !isEverythingVisible } : point
                ),
            },
        });
    };

    useToggleSelectAllKeyboardShortcut(handleSelectAllToggle);
    useDeleteKeyboardShortcut(removeAnnotations, hasShapePointSelected, [keypointAnnotation]);

    return (
        <Flex
            alignItems={'center'}
            justifyContent={'space-between'}
            UNSAFE_style={{ padding: dimensionValue('size-100') }}
        >
            <TooltipTrigger placement={'bottom'}>
                <Checkbox
                    isEmphasized
                    key='select-points'
                    id={'points-list-select-all'}
                    UNSAFE_style={{ padding: 0 }}
                    onFocusChange={blurActiveInput}
                    aria-label={selectAllPointsAriaLabel}
                    isSelected={hasSelectedPoints}
                    isDisabled={isSceneBusy || !isActiveLearningMode}
                    onChange={() => handleSelectAllToggle(!hasSelectedPoints)}
                />
                <Tooltip>{selectionTooltipText}</Tooltip>
            </TooltipTrigger>

            <TooltipTrigger placement={'bottom'}>
                <ActionButton
                    isQuiet
                    isDisabled={!hasSelectedPoints}
                    onPress={handleSelectedVisibilityToggle}
                    aria-label='visibility toggle'
                >
                    <ToggleAllIcon />
                </ActionButton>
                <Tooltip>{visibilityTooltipText}</Tooltip>
            </TooltipTrigger>
        </Flex>
    );
};
