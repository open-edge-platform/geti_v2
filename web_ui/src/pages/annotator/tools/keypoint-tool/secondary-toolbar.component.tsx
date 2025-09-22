// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ActionButton, Divider, Flex, Text, Tooltip, TooltipTrigger } from '@geti/ui';
import { Delete, LineMappingLight } from '@geti/ui/icons';

import { isKeypointAnnotation } from '../../../../core/annotations/services/utils';
import { PointAxis } from '../../../utils';
import { useVisibleAnnotations } from '../../hooks/use-visible-annotations.hook';
import { ToolAnnotationContextProps } from '../tools.interface';
import { useKeypointState } from './keypoint-state-provider.component';
import { mirrorPointsAcrossAxis } from './utils';

export const SecondaryToolbar = ({ annotationToolContext }: ToolAnnotationContextProps) => {
    const visibleAnnotations = useVisibleAnnotations();

    const { scene } = annotationToolContext;
    const keypointAnnotation = visibleAnnotations.find(isKeypointAnnotation);
    const { currentBoundingBox, setCurrentBoundingBox } = useKeypointState();
    const hasAnnotations = keypointAnnotation !== undefined;
    const hasCurrentBoundingBox = currentBoundingBox !== null;

    const handleDeleteAnnotation = () => {
        setCurrentBoundingBox(null);
        scene.removeAnnotations(visibleAnnotations);
    };

    const handleMirrorAnnotation = (axis: PointAxis) => {
        if (keypointAnnotation === undefined) {
            return;
        }

        const slippedShape = {
            ...keypointAnnotation.shape,
            points: mirrorPointsAcrossAxis(keypointAnnotation.shape.points, axis),
        };

        scene.replaceAnnotations([{ ...keypointAnnotation, isSelected: true, shape: slippedShape }]);
    };

    return (
        <Flex direction='row' alignItems='center' justifyContent='center' gap='size-125'>
            <Text>Keypoint tool</Text>

            <Divider orientation='vertical' size='S' />

            <TooltipTrigger placement={'bottom'}>
                <ActionButton
                    isQuiet
                    isDisabled={!hasAnnotations}
                    onPress={handleDeleteAnnotation}
                    aria-label={'delete keypoint annotation'}
                >
                    <Delete height={20} width={20} />
                </ActionButton>
                <Tooltip>{`Delete keypoint annotation`}</Tooltip>
            </TooltipTrigger>

            <TooltipTrigger placement={'bottom'}>
                <ActionButton
                    isQuiet
                    isDisabled={!hasAnnotations || hasCurrentBoundingBox}
                    aria-label={'mirror X-axis'}
                    onPress={() => handleMirrorAnnotation(PointAxis.X)}
                >
                    <LineMappingLight height={20} width={20} />
                </ActionButton>
                <Tooltip>Mirror X axis</Tooltip>
            </TooltipTrigger>

            <TooltipTrigger placement={'bottom'}>
                <ActionButton
                    isQuiet
                    isDisabled={!hasAnnotations || hasCurrentBoundingBox}
                    aria-label={'mirror Y-axis'}
                    onPress={() => handleMirrorAnnotation(PointAxis.Y)}
                >
                    <LineMappingLight style={{ transform: 'rotate(90deg)' }} height={20} width={20} />
                </ActionButton>
                <Tooltip>Mirror Y axis</Tooltip>
            </TooltipTrigger>
        </Flex>
    );
};
