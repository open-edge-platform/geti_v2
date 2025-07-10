// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { UseQueryResult } from '@tanstack/react-query';

import { Annotation, KeypointAnnotation } from '../../../../../core/annotations/annotation.interface';
import { PredictionMode } from '../../../../../core/annotations/services/prediction-service.interface';
import { MEDIA_TYPE } from '../../../../../core/media/base-media.interface';
import { Video } from '../../../../../core/media/video.interface';
import { getIds } from '../../../../../shared/utils';
import { useDatasetIdentifier } from '../../../hooks/use-dataset-identifier.hook';
import { getVideoOptions } from '../streaming-video-player/utils';
import { useVideoPlayer } from '../video-player-provider.component';
import { useVideoAnnotationsQuery } from './use-video-annotations-query.hook';
import { useVideoPredictionsQuery } from './use-video-predictions-query.hook';

const getKeypointLabelIds = (annotations: readonly Annotation[]) => {
    const keypointAnnotations = annotations as KeypointAnnotation[];
    return keypointAnnotations.flatMap((annotation) => annotation.shape.points.flatMap(({ label }) => label.id));
};

export const selectLabelsOfFrame = (frameNumber: number, isKeypoint: boolean) => {
    return (data: Record<number, ReadonlyArray<Annotation>>) => {
        if (data[frameNumber]) {
            const annotations = data[Number(frameNumber)];
            const labelIds = isKeypoint
                ? getKeypointLabelIds(annotations)
                : annotations.flatMap(({ labels }) => getIds(labels));
            return new Set<string>(labelIds);
        }

        return new Set<string>();
    };
};

interface UseVideoEditor {
    annotationsQuery: UseQueryResult<Set<string>>;
    predictionsQuery: UseQueryResult<Set<string>>;
}

const TIMELINE_VIDEO_FRAMES_CHUNK_SIZE = 20;
// This hook returns annotations and predictions queries that load a chunk of frames,
// while using the `select` option so that consumers of this hook only get the annotations
// and predictions associatd to the given frame number.
// This makes it so that we can request annotations and predictions for 1 frame, while caching
// the data for any neighbouring frames
export const useVideoTimelineQueries = (frameNumber: number, isKeypoint: boolean): UseVideoEditor => {
    // TODO: this can change if the user changes the selected dataset, which will
    // introduce a bug
    const datasetIdentifier = useDatasetIdentifier();
    const { videoFrame, step } = useVideoPlayer();

    const video: Video = {
        ...videoFrame,
        identifier: { type: MEDIA_TYPE.VIDEO, videoId: videoFrame.identifier.videoId },
    };

    const select = selectLabelsOfFrame(frameNumber, isKeypoint);
    const options = getVideoOptions(video, frameNumber, step, TIMELINE_VIDEO_FRAMES_CHUNK_SIZE);

    const annotationsQuery = useVideoAnnotationsQuery(datasetIdentifier, video, select, options);
    const predictionsQuery = useVideoPredictionsQuery(datasetIdentifier, video, select, options, PredictionMode.LATEST);

    return { annotationsQuery, predictionsQuery };
};
