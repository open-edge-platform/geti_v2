# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE


from service.job_submission.base import JobParams, ModelJobSubmitter
from service.job_submission.job_creation_helpers import OPTIMIZE_JOB_PRIORITY, JobDuplicatePolicy, OptimizationJobData

from geti_types import ID
from iai_core.entities.model import Model, ModelOptimizationType
from iai_core.entities.project import Project


class ModelOptimizationJobSubmitter(ModelJobSubmitter):
    def prepare_data(  # type: ignore
        self,
        project: Project,
        model: Model,
        optimization_type: ModelOptimizationType,
        author: ID,
    ) -> JobParams:
        """
        Prepares data for an optimize job submission.

        :param project: project containing model and dataset storage
        :param model: model to perform optimization on
        :param optimization_type: Optimization type to optimize the model with
        :param author: ID of the user submitting the job
        :return: ID of the optimization job that has been submitted.
        """
        optimization_job_data = OptimizationJobData(
            workspace_id=project.workspace_id,
            project=project,
            training_dataset_storage=project.get_training_dataset_storage(),
            model=model,
            optimization_type=optimization_type,
        )
        return JobParams(
            priority=OPTIMIZE_JOB_PRIORITY,
            job_name=optimization_job_data.job_name,
            job_type=optimization_job_data.job_type,
            key=optimization_job_data.create_key(),
            payload=optimization_job_data.create_payload(),
            metadata=optimization_job_data.create_metadata(),
            duplicate_policy=JobDuplicatePolicy.REJECT.name.lower(),
            author=author,
            project_id=project.id_,
            gpu_num_required=optimization_job_data.gpu_num_required,
            cancellable=True,
        )
