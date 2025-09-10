# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
"""
Optimize workflow
"""

import logging
from typing import Optional

from flytekit import workflow
from iai_core.entities.model import ModelOptimizationType

from job.tasks.evaluation_task import evaluate_optimized_model_pot
from job.tasks.optimization_task import shard_dataset_prepare_models_and_start_optimization

logger = logging.getLogger(__name__)


@workflow
def optimize_workflow_pot(  # noqa: PLR0913
    project_id: str,
    dataset_storage_id: str,
    model_storage_id: str,
    model_id: str,
    enable_optimize_from_dataset_shard: bool = False,
    max_shard_size: int = 1000,
    num_image_pulling_threads: int = 10,
    num_upload_threads: int = 2,
    min_annotation_size: Optional[int] = None,  # noqa: UP007
    max_annotation_size: Optional[int] = None,  # noqa: UP007
    min_number_of_annotations: Optional[int] = None,  # noqa: UP007
    max_number_of_annotations: Optional[int] = None,  # noqa: UP007
    # Optimize command
    command: list[str] = ["bash", "-c", "run"],
    retain_training_artifacts: bool = False,
) -> None:
    """
    Runs a model optimization workflow

    :param project_id: ID of the project
    :param dataset_storage_id: ID of the dataset_storage_id
    :param model_storage_id: ID of the model_storage
    :param model_id: ID of the model to optimize
    :param enable_optimize_from_dataset_shard: Whether to enable model optimization from dataset shard
    :param max_shard_size: Maximum number of dataset items in each shard file
    :param num_image_pulling_threads: Number of threads used for pulling image bytes
    :param num_upload_threads: Number of threads used for uploading shard files
    :param min_annotation_size: Minimum size of an annotation in pixels. Any annotation smaller than this will be
     ignored during evaluation
    :param max_annotation_size: Maximum size of an annotation in pixels. Any annotation larger than this will be
     ignored during evaluation
    :param min_number_of_annotations: Minimum number of annotations allowed in one annotation scene. If not None,
        annotation scenes with fewer than this number of annotations will be ignored during evaluation.
    :param max_number_of_annotations: Maximum number of annotation allowed in one annotation scene. If exceeded, the
     annotation scene will be ignored during evaluation.
    :param command: Command to be executed on the primary container, e.g., OTX2 trainer pod.
    :param retain_training_artifacts: If true, do not remove the artifacts in bucket even if training succeeds.
        It would be useful for debugging.
    """

    optimization_ctx = shard_dataset_prepare_models_and_start_optimization(
        project_id=project_id,
        model_storage_id=model_storage_id,
        model_id=model_id,
        max_shard_size=max_shard_size,
        num_image_pulling_threads=num_image_pulling_threads,
        num_upload_threads=num_upload_threads,
        enable_optimize_from_dataset_shard=enable_optimize_from_dataset_shard,
        optimization_type=ModelOptimizationType.POT.name,
        command=command,
        min_annotation_size=min_annotation_size,
        max_annotation_size=max_annotation_size,
        min_number_of_annotations=min_number_of_annotations,
        max_number_of_annotations=max_number_of_annotations,
    )

    evaluate_optimized_model_pot(
        trainer_ctx=optimization_ctx,
        dataset_storage_id=dataset_storage_id,
        model_id=model_id,
        retain_training_artifacts=retain_training_artifacts,
        min_annotation_size=min_annotation_size,
        max_annotation_size=max_annotation_size,
        min_number_of_annotations=min_number_of_annotations,
        max_number_of_annotations=max_number_of_annotations,
    )
