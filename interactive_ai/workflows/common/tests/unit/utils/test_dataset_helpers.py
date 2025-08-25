# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
from unittest.mock import ANY, call, patch

from iai_core.entities.dataset_entities import TaskDataset
from iai_core.entities.dataset_item import DatasetItem
from iai_core.entities.datasets import Dataset, DatasetPurpose
from iai_core.entities.project import Project
from iai_core.repos import DatasetRepo, LabelSchemaRepo

from jobs_common.utils.annotation_filter import AnnotationFilter
from jobs_common.utils.dataset_helpers import DatasetHelpers
from jobs_common.utils.subset_management.subset_manager import TaskSubsetManager


class TestDatasetHelpers:
    def test_construct_and_save_train_dataset_for_task(
        self,
        fxt_session_ctx,
        fxt_detection_project,
        fxt_video_factory,
        fxt_video_frame_entity_factory,
        fxt_annotation_scene,
        fxt_training_configuration,
    ) -> None:
        project: Project = fxt_detection_project
        task_node = project.get_trainable_task_nodes()[0]
        dataset_storage = project.get_training_dataset_storage()
        video = fxt_video_factory()
        video_frames = [fxt_video_frame_entity_factory(video=video, index=i) for i in range(25)]
        input_dataset_items = [
            DatasetItem(
                id_=DatasetRepo.generate_id(),
                media=video_frame,
                annotation_scene=fxt_annotation_scene,
            )
            for video_frame in video_frames
        ]
        input_dataset = Dataset(items=input_dataset_items, id=DatasetRepo.generate_id())

        with (
            patch.object(LabelSchemaRepo, "get_latest_view_by_task") as mock_get_label_schema,
            patch.object(TaskDataset, "get_dataset", return_value=input_dataset) as mock_get_dataset,
            patch.object(TaskSubsetManager, "split") as mock_split,
            patch.object(TaskDataset, "save_subsets") as mock_save_subsets,
            patch("jobs_common.utils.dataset_helpers.publish_event") as mock_publish_event,
            patch.object(DatasetRepo, "save_deep") as mock_save_deep,
            patch.object(AnnotationFilter, "apply_annotation_filters") as mock_apply_annotation_filters,
        ):
            train_dataset = DatasetHelpers.construct_and_save_train_dataset_for_task(
                task_dataset_entity=TaskDataset(
                    task_node_id=task_node.id_,
                    dataset_storage_id=project.training_dataset_storage_id,
                    dataset_id=input_dataset.id_,
                ),
                project_id=project.id_,
                task_node=task_node,
                dataset_storage=dataset_storage,
                training_configuration=fxt_training_configuration,
                max_training_dataset_size=1000,
                reshuffle_subsets=True,
            )

        filter_params = fxt_training_configuration.global_parameters.dataset_preparation.filtering
        mock_apply_annotation_filters.assert_called_once_with(
            dataset=ANY,
            min_number_of_annotations=filter_params.min_annotation_objects.min_annotation_objects,
            max_number_of_annotations=filter_params.max_annotation_objects.max_annotation_objects,
            min_annotation_size=filter_params.min_annotation_pixels.min_annotation_pixels,
            max_annotation_size=filter_params.max_annotation_pixels.max_annotation_pixels,
        )
        mock_get_label_schema.assert_called_once_with(task_node_id=task_node.id_)
        mock_get_dataset.assert_called_once_with(dataset_storage=project.get_training_dataset_storage())
        mock_split.assert_called_once()
        mock_save_subsets.assert_called_once_with(
            dataset=input_dataset, dataset_storage_identifier=dataset_storage.identifier
        )
        mock_publish_event.assert_has_calls(
            [
                # two calls to dataset_updated because the dataset size is 25 and the max chunk size is 20
                call(
                    topic="dataset_updated",
                    body=ANY,
                    key=str(task_node.id_).encode(),
                    headers_getter=ANY,
                ),
                call(
                    topic="dataset_updated",
                    body=ANY,
                    key=str(task_node.id_).encode(),
                    headers_getter=ANY,
                ),
            ]
        )
        mock_save_deep.assert_called_once_with(train_dataset)
        assert train_dataset.purpose == DatasetPurpose.TRAINING
        assert len(train_dataset) == len(input_dataset)
