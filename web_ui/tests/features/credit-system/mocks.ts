// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ProjectConfigurationDTO } from '../../../src/core/configurable-parameters/dtos/configuration.interface';
import { JobCostPropsDTO } from '../../../src/core/jobs/dtos/jobs-dto.interface';
import { GETI_SYSTEM_AUTHOR_ID, JobState, JobType } from '../../../src/core/jobs/jobs.const';
import { getMockedJob } from '../project-dataset/utils';

export const detectionTaskId = '60db493fd20945a0046f56d2';

export const getScheduledTrainingJob = (job = getMockedJob({ state: JobState.SCHEDULED })) => ({
    jobs: [
        {
            ...job,
            type: JobType.TRAIN,
            metadata: {
                project: {
                    id: '662f70313090f9f2aa13b7ed',
                    name: 'Candy',
                },
                task: {
                    task_id: '662f70313090f9f2aa13b7f0',
                    name: 'Detection',
                    model_template_id: 'Custom_Object_Detection_Gen3_ATSS',
                    model_architecture: 'MobileNetV2-ATSS',
                    dataset_storage_id: '662f70313090f9f2aa13b7f4',
                },
            },
        },
    ],
    jobs_count: {
        n_scheduled_jobs: 1,
        n_running_jobs: 0,
        n_finished_jobs: 0,
        n_failed_jobs: 0,
        n_cancelled_jobs: 0,
    },
});

export const getRunningAutoTrainingJob = (
    job = getMockedJob({ state: JobState.RUNNING, author: GETI_SYSTEM_AUTHOR_ID })
) => ({
    jobs: [
        {
            ...job,
            type: JobType.TRAIN,
            metadata: {
                project: {
                    id: '662f70313090f9f2aa13b7ed',
                    name: 'Candy',
                },
                task: {
                    task_id: '662f70313090f9f2aa13b7f0',
                    name: 'Detection',
                    model_template_id: 'Custom_Object_Detection_Gen3_ATSS',
                    model_architecture: 'MobileNetV2-ATSS',
                    dataset_storage_id: '662f70313090f9f2aa13b7f4',
                },
            },
        },
    ],
    jobs_count: {
        n_scheduled_jobs: 1,
        n_running_jobs: 0,
        n_finished_jobs: 0,
        n_failed_jobs: 0,
        n_cancelled_jobs: 0,
    },
});

export const getScheduledAutoTrainingJob = (
    job = getMockedJob({ state: JobState.SCHEDULED, author: GETI_SYSTEM_AUTHOR_ID })
) => ({
    jobs: [
        {
            ...job,
            type: JobType.TRAIN,
            metadata: {
                project: {
                    id: '662f70313090f9f2aa13b7ed',
                    name: 'Candy',
                },
                task: {
                    task_id: '662f70313090f9f2aa13b7f0',
                    name: 'Detection',
                    model_template_id: 'Custom_Object_Detection_Gen3_ATSS',
                    model_architecture: 'MobileNetV2-ATSS',
                    dataset_storage_id: '662f70313090f9f2aa13b7f4',
                },
            },
        },
    ],
    jobs_count: {
        n_scheduled_jobs: 1,
        n_running_jobs: 0,
        n_finished_jobs: 0,
        n_failed_jobs: 0,
        n_cancelled_jobs: 0,
    },
});

export const getFinishedTrainingJob = (job = getMockedJob({ state: JobState.FINISHED })) => ({
    jobs: [
        {
            ...job,
            type: JobType.TRAIN,
            metadata: {
                project: {
                    id: '662f70313090f9f2aa13b7ed',
                    name: 'Candy',
                },
                task: {
                    task_id: '662f70313090f9f2aa13b7f0',
                    name: 'Detection',
                    model_template_id: 'Custom_Object_Detection_Gen3_ATSS',
                    model_architecture: 'MobileNetV2-ATSS',
                    dataset_storage_id: '662f70313090f9f2aa13b7f4',
                },
                trained_model: {
                    model_id: 'model-id',
                },
            },
        },
    ],
    jobs_count: {
        n_scheduled_jobs: 0,
        n_running_jobs: 0,
        n_finished_jobs: 1,
        n_failed_jobs: 0,
        n_cancelled_jobs: 0,
    },
});

export const getFinishedAutoTrainingJob = (
    job = getMockedJob({ state: JobState.FINISHED, author: GETI_SYSTEM_AUTHOR_ID })
) => ({
    jobs: [
        {
            ...job,
            type: JobType.TRAIN,
            metadata: {
                project: {
                    id: '662f70313090f9f2aa13b7ed',
                    name: 'Candy',
                },
                task: {
                    task_id: '662f70313090f9f2aa13b7f0',
                    name: 'Detection',
                    model_template_id: 'Custom_Object_Detection_Gen3_ATSS',
                    model_architecture: 'MobileNetV2-ATSS',
                    dataset_storage_id: '662f70313090f9f2aa13b7f4',
                },
                trained_model: {
                    model_id: '6343d5e4aba8c6d87d17ab6a',
                },
            },
        },
    ],
    jobs_count: {
        n_scheduled_jobs: 0,
        n_running_jobs: 0,
        n_finished_jobs: 1,
        n_failed_jobs: 0,
        n_cancelled_jobs: 0,
    },
});

export const getEmptyJobs = () => ({
    jobs: [],
    jobs_count: {
        n_scheduled_jobs: 0,
        n_running_jobs: 0,
        n_finished_jobs: 0,
        n_failed_jobs: 0,
        n_cancelled_jobs: 0,
    },
});

export const getScheduledAutoTrainingCostJob = (consumed: JobCostPropsDTO['consumed']) =>
    getScheduledAutoTrainingJob(
        getMockedJob({
            state: JobState.SCHEDULED,
            author: GETI_SYSTEM_AUTHOR_ID,
            cost: {
                requests: [{ unit: 'images', amount: 6 }],
                lease_id: '123',
                consumed,
            },
        })
    );

export const getScheduledTrainingCostJob = (consumed: JobCostPropsDTO['consumed']) =>
    getScheduledTrainingJob(
        getMockedJob({
            state: JobState.SCHEDULED,
            cost: {
                requests: [{ unit: 'images', amount: 6 }],
                lease_id: '123',
                consumed,
            },
        })
    );

export const projectConfigAutoTrainingOnMock = {
    global: [],
    task_chain: [
        {
            components: [
                {
                    description: 'General settings for a task.',
                    entity_identifier: {
                        component: 'TASK_NODE',
                        project_id: '65fd5dde32fa8ee3491d6c92',
                        task_id: detectionTaskId,

                        type: 'COMPONENT_PARAMETERS',
                        workspace_id: 'e7298c67-ef65-40f6-a489-c7dc17c26766',
                    },
                    header: 'General',
                    id: '65fd5df7e6767ac9611de29d',
                    parameters: [
                        {
                            data_type: 'boolean',
                            default_value: true,
                            description:
                                'Enable to allow the task to start training automatically when it is ready to train.',
                            editable: true,
                            header: 'Auto-training',
                            name: 'auto_training',
                            template_type: 'input',
                            ui_rules: {},
                            value: true,
                            warning: null,
                        },
                    ],
                    type: 'CONFIGURABLE_PARAMETERS',
                },
                {
                    description: 'Specify the number of required annotations for a task',
                    entity_identifier: {
                        component: 'DATASET_COUNTER',
                        project_id: '4dbaf08393691189a1c129eb',
                        task_id: '4dbaf08393691189a1c129ee',
                        type: 'COMPONENT_PARAMETERS',
                        workspace_id: '8c958be2-68ea-437a-8a35-43ff1ecf5192',
                    },
                    header: 'Annotation requirements',
                    id: '4dbaf083bee39aa0eac8f805',
                    parameters: [
                        {
                            data_type: 'boolean',
                            default_value: false,
                            description:
                                // eslint-disable-next-line max-len
                                'Only applicable if auto-training is on. Set this parameter on to let the system dynamically compute the number of required annotations between training rounds based on model performance and training dataset size.',
                            editable: true,
                            header: 'Dynamic required annotations',
                            name: 'use_dynamic_required_annotations',
                            template_type: 'input',
                            ui_rules: {},
                            value: false,
                            warning: null,
                        },
                    ],
                    type: 'CONFIGURABLE_PARAMETERS',
                },
            ],
            task_id: detectionTaskId,

            task_title: 'Detection',
        },
        {
            components: [
                {
                    description: 'General settings for a task.',
                    entity_identifier: {
                        component: 'TASK_NODE',
                        project_id: '65fd5dde32fa8ee3491d6c92',
                        task_id: '60db493fd20945a0046f56d6',
                        type: 'COMPONENT_PARAMETERS',
                        workspace_id: 'e7298c67-ef65-40f6-a489-c7dc17c26766',
                    },
                    header: 'General',
                    id: '65fd5df7e6767ac9611de2a4',
                    parameters: [
                        {
                            data_type: 'boolean',
                            default_value: true,
                            description:
                                'Enable to allow the task to start training automatically when it is ready to train.',
                            editable: true,
                            header: 'Auto-training',
                            name: 'auto_training',
                            template_type: 'input',
                            ui_rules: {},
                            value: true,
                            warning: null,
                        },
                    ],
                    type: 'CONFIGURABLE_PARAMETERS',
                },
                {
                    description: 'Specify the number of required annotations for a task',
                    entity_identifier: {
                        component: 'DATASET_COUNTER',
                        project_id: '4dbaf08393691189a1c129eb',
                        task_id: '4dbaf08393691189a1c129ee',
                        type: 'COMPONENT_PARAMETERS',
                        workspace_id: '8c958be2-68ea-437a-8a35-43ff1ecf5192',
                    },
                    header: 'Annotation requirements',
                    id: '4dbaf083bee39aa0eac8f805',
                    parameters: [
                        {
                            data_type: 'boolean',
                            default_value: false,
                            description:
                                // eslint-disable-next-line max-len
                                'Only applicable if auto-training is on. Set this parameter on to let the system dynamically compute the number of required annotations between training rounds based on model performance and training dataset size.',
                            editable: true,
                            header: 'Dynamic required annotations',
                            name: 'use_dynamic_required_annotations',
                            template_type: 'input',
                            ui_rules: {},
                            value: false,
                            warning: null,
                        },
                    ],
                    type: 'CONFIGURABLE_PARAMETERS',
                },
            ],
            task_id: '60db493fd20945a0046f56d6',
            task_title: 'Classification',
        },
    ],
};

export const projectConfigAutoTrainingOffMock = {
    ...projectConfigAutoTrainingOnMock,
    task_chain: projectConfigAutoTrainingOnMock.task_chain.map((taskChain) => ({
        ...taskChain,
        components: taskChain.components.map((component) => ({
            ...component,
            parameters: component.parameters.map((parameters) => ({ ...parameters, value: false })),
        })),
    })),
};

export const projectConfigurationAutoTrainingOnMock: ProjectConfigurationDTO = {
    task_configs: [
        {
            task_id: detectionTaskId,
            training: {
                constraints: [
                    {
                        key: 'min_images_per_label',
                        name: 'Minimum number of images per label',
                        type: 'int',
                        description: 'Minimum number of images that must be present for each label to train',
                        value: 0,
                        default_value: 0,
                        min_value: 0,
                        max_value: null,
                    },
                ],
            },
            auto_training: [
                {
                    key: 'enable',
                    name: 'Enable auto training',
                    type: 'bool',
                    description: 'Whether automatic training is enabled for this task',
                    value: true,
                    default_value: true,
                },
                {
                    key: 'enable_dynamic_required_annotations',
                    name: 'Enable dynamic required annotations',
                    type: 'bool',
                    description: 'Whether to dynamically adjust the number of required annotations',
                    value: false,
                    default_value: false,
                },
                {
                    key: 'min_images_per_label',
                    name: 'Minimum images per label',
                    type: 'int',
                    description: 'Minimum number of images needed for each label to trigger auto-training',
                    value: 12,
                    default_value: 12,
                    min_value: 3,
                    max_value: null,
                },
            ],
        },
        {
            task_id: '60db493fd20945a0046f56d6',
            training: {
                constraints: [
                    {
                        key: 'min_images_per_label',
                        name: 'Minimum number of images per label',
                        type: 'int',
                        description: 'Minimum number of images that must be present for each label to train',
                        value: 0,
                        default_value: 0,
                        min_value: 0,
                        max_value: null,
                    },
                ],
            },
            auto_training: [
                {
                    key: 'enable',
                    name: 'Enable auto training',
                    type: 'bool',
                    description: 'Whether automatic training is enabled for this task',
                    value: true,
                    default_value: true,
                },
                {
                    key: 'enable_dynamic_required_annotations',
                    name: 'Enable dynamic required annotations',
                    type: 'bool',
                    description: 'Whether to dynamically adjust the number of required annotations',
                    value: false,
                    default_value: false,
                },
                {
                    key: 'min_images_per_label',
                    name: 'Minimum images per label',
                    type: 'int',
                    description: 'Minimum number of images needed for each label to trigger auto-training',
                    value: 12,
                    default_value: 12,
                    min_value: 3,
                    max_value: null,
                },
            ],
        },
    ],
};

export const projectConfigurationAutoTrainingOffMock: ProjectConfigurationDTO = {
    task_configs: [
        {
            task_id: detectionTaskId,
            training: {
                constraints: [
                    {
                        key: 'min_images_per_label',
                        name: 'Minimum number of images per label',
                        type: 'int',
                        description: 'Minimum number of images that must be present for each label to train',
                        value: 0,
                        default_value: 0,
                        min_value: 0,
                        max_value: null,
                    },
                ],
            },
            auto_training: [
                {
                    key: 'enable',
                    name: 'Enable auto training',
                    type: 'bool',
                    description: 'Whether automatic training is enabled for this task',
                    value: false,
                    default_value: true,
                },
                {
                    key: 'enable_dynamic_required_annotations',
                    name: 'Enable dynamic required annotations',
                    type: 'bool',
                    description: 'Whether to dynamically adjust the number of required annotations',
                    value: false,
                    default_value: false,
                },
                {
                    key: 'min_images_per_label',
                    name: 'Minimum images per label',
                    type: 'int',
                    description: 'Minimum number of images needed for each label to trigger auto-training',
                    value: 12,
                    default_value: 12,
                    min_value: 3,
                    max_value: null,
                },
            ],
        },
        {
            task_id: '60db493fd20945a0046f56d6',
            training: {
                constraints: [
                    {
                        key: 'min_images_per_label',
                        name: 'Minimum number of images per label',
                        type: 'int',
                        description: 'Minimum number of images that must be present for each label to train',
                        value: 0,
                        default_value: 0,
                        min_value: 0,
                        max_value: null,
                    },
                ],
            },
            auto_training: [
                {
                    key: 'enable',
                    name: 'Enable auto training',
                    type: 'bool',
                    description: 'Whether automatic training is enabled for this task',
                    value: false,
                    default_value: true,
                },
                {
                    key: 'enable_dynamic_required_annotations',
                    name: 'Enable dynamic required annotations',
                    type: 'bool',
                    description: 'Whether to dynamically adjust the number of required annotations',
                    value: false,
                    default_value: false,
                },
                {
                    key: 'min_images_per_label',
                    name: 'Minimum images per label',
                    type: 'int',
                    description: 'Minimum number of images needed for each label to trigger auto-training',
                    value: 12,
                    default_value: 12,
                    min_value: 3,
                    max_value: null,
                },
            ],
        },
    ],
};
