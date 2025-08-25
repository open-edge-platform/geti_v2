// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ProjectConfigurationDTO } from '../../../../src/core/configurable-parameters/dtos/configuration.interface';
import { TASK_TYPE } from '../../../../src/core/projects/dtos/task.interface';
import {
    LifecycleStage,
    PerformanceCategory,
    SupportedAlgorithmDTO,
} from '../../../../src/core/supported-algorithms/dtos/supported-algorithms.interface';
import { project } from '../../../mocks/segmentation/mocks';

export const modelGroups = {
    model_groups: [
        {
            id: '672d00c843da978dfb79fe98',
            name: 'SAM',
            model_template_id: 'visual_prompting_model',
            task_id: '6101254defba22ca453f11d1',
            models: [
                {
                    id: '672d00c843da978dfb79fe9a',
                    name: 'SAM',
                    creation_date: '2024-11-07T18:02:48.377000+00:00',
                    active_model: false,
                    size: 49254642,
                    performance: {
                        score: 0.7807059616222896,
                    },
                    label_schema_in_sync: true,
                    version: 1,
                    purge_info: {
                        is_purged: false,
                        purge_time: null,
                        user_uid: null,
                    },
                },
            ],
            learning_approach: 'one_shot',
            lifecycle_stage: 'active',
        },
    ],
};

export const supportedAlgorithms: { supported_algorithms: SupportedAlgorithmDTO[] } = {
    supported_algorithms: [
        {
            model_manifest_id: modelGroups.model_groups[0].model_template_id,
            task: TASK_TYPE.SEGMENTATION,
            name: 'SegNext-T',
            description: 'ABC',
            stats: {
                gigaflops: 12.44,
                trainable_parameters: 4.23,
                performance_ratings: {
                    accuracy: 2,
                    training_time: 3,
                    inference_speed: 3,
                },
            },
            support_status: LifecycleStage.ACTIVE,
            supported_gpus: {
                intel: true,
                nvidia: true,
            },
            capabilities: {
                xai: true,
                tiling: true,
            },
            is_default_model: false,
            performance_category: PerformanceCategory.OTHER,
        },
    ],
};

export const modelDetail = {
    id: '672d00c843da978dfb79fe9a',
    name: 'SAM',
    architecture: 'SAM',
    version: 1,
    creation_date: '2024-11-07T18:02:48.377000+00:00',
    size: 49254642,
    performance: {
        score: 0.7807059616222896,
    },
    label_schema_in_sync: true,
    precision: ['FP32'],
    optimized_models: [],
    labels: [
        {
            id: '6101254defba22ca453f11c6',
            name: 'Card',
            is_anomalous: false,
            color: '#81407bff',
            hotkey: '',
            is_empty: false,
            group: 'Instance segmentation labels',
            parent_id: null,
        },
        {
            id: '672cfd8046d386c537aafb05',
            name: 'Empty',
            is_anomalous: false,
            color: '#000000ff',
            hotkey: '',
            is_empty: true,
            group: 'Empty',
            parent_id: null,
        },
    ],
    training_dataset_info: {
        dataset_storage_id: '672cfd8046d386c537aafb02',
        dataset_revision_id: '672d00c843da978dfb79fe99',
        n_samples: 1,
        n_images: 1,
        n_videos: 0,
        n_frames: 0,
    },
    training_framework: {
        type: 'geti_vps',
        version: '1.0',
    },
    purge_info: {
        is_purged: false,
        purge_time: null,
        user_uid: null,
    },
    total_disk_size: 48263259,
    learning_approach: 'one_shot',
    previous_revision_id: '',
    previous_trained_revision_id: '',
};

export const testResults = [
    {
        creation_time: '2024-11-07T18:03:11.673000+00:00',
        datasets_info: [
            {
                id: '672cfd8046d386c537aafb02',
                is_deleted: false,
                n_frames: 0,
                n_images: 129,
                n_samples: 129,
                name: 'Dataset',
            },
        ],
        id: '672d00df055da73fae2a4451',
        job_info: {
            id: '672d00df17709684cdea4956',
            status: 'DONE',
        },
        model_info: {
            group_id: '672d00c843da978dfb79fe98',
            id: '672d00c843da978dfb79fe9a',
            n_labels: 1,
            optimization_type: 'NONE',
            precision: ['FP32'],
            task_id: '6101254defba22ca453f11d1',
            task_type: 'VISUAL_PROMPTING',
            template_id: 'visual_prompting_model',
            version: 1,
        },
        name: 'T1',
        scores: [
            { label_id: null, name: 'Dice', value: 0.9513264945217998 },
            { label_id: '672cfd8046d386c537aafb01', name: 'Card', value: 0.9513264945217998 },
        ],
    },
];

export const test = {
    creation_time: '2024-11-07T18:03:11.673000+00:00',
    datasets_info: [
        {
            id: '672cfd8046d386c537aafb02',
            is_deleted: false,
            n_frames: 0,
            n_images: 129,
            n_samples: 129,
            name: 'Dataset',
        },
    ],
    id: '672d00df055da73fae2a4451',
    job_info: {
        id: '672d00df17709684cdea4956',
        status: 'DONE',
    },
    model_info: {
        group_id: '672d00c843da978dfb79fe98',
        id: '672d00c843da978dfb79fe9a',
        n_labels: 1,
        optimization_type: 'NONE',
        precision: ['FP32'],
        task_id: '6101254defba22ca453f11d1',
        task_type: 'VISUAL_PROMPTING',
        template_id: 'visual_prompting_model',
        version: 1,
    },
    name: 'T1',
    scores: [
        {
            label_id: null,
            name: 'Dice',
            value: 0.9513264945217998,
        },
        {
            label_id: '672cfd8046d386c537aafb01',
            name: 'Card',
            value: 0.9513264945217998,
        },
    ],
};

export const projectConfiguration: ProjectConfigurationDTO = {
    task_configs: [
        {
            task_id: project.pipeline.tasks[1].id,
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
