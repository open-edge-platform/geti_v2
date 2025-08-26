// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Fragment, RefObject } from 'react';

import { Labels } from '../../annotation/labels/labels.component';
import { useAnnotatorMode } from '../../hooks/use-annotator-mode';
import { getOutputFromTask } from '../../providers/task-chain-provider/utils';
import { useTask } from '../../providers/task-provider/task-provider.component';
import { ToolAnnotationContextProps } from '../tools.interface';
import { EditAnnotationTool } from './edit-annotation-tool.component';

import classes from './../../annotator-canvas.module.scss';

interface EditToolProps extends ToolAnnotationContextProps {
    disableTranslation?: boolean;
    disablePoints?: boolean;
    canvasRef?: RefObject<SVGSVGElement>;
}

export const EditTool = ({
    annotationToolContext,
    disableTranslation = false,
    disablePoints = false,
    canvasRef,
}: EditToolProps): JSX.Element => {
    const { tasks, selectedTask } = useTask();
    const { isActiveLearningMode } = useAnnotatorMode();

    const {
        scene: { annotations: annotationsScene },
    } = annotationToolContext;

    if (!isActiveLearningMode) {
        return <></>;
    }

    // TODO: only get annotations from the current task
    const annotations = getOutputFromTask(annotationsScene, tasks, selectedTask).filter(
        ({ isSelected, isHidden, isLocked }) => isSelected && !isHidden && !isLocked
    );

    return (
        <div aria-label='edit-annotations' className={classes.disabledLayer}>
            {annotations.map((annotation, index) => {
                return (
                    <Fragment key={annotation.id}>
                        <EditAnnotationTool
                            annotation={annotation}
                            annotationToolContext={annotationToolContext}
                            disablePoints={disablePoints}
                            disableTranslation={disableTranslation}
                            canvasRef={canvasRef}
                        />
                        <Labels key={`${annotation.id}-${index}`} annotation={annotation} />
                    </Fragment>
                );
            })}
        </div>
    );
};
