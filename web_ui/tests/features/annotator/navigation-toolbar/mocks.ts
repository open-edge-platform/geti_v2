// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

// This is a smaller version of the task chain configuration we would receive
// when calling the GetFullConfiguration endpoint of a detection->segmentation
// task chain project
// ALl except the auto training and dynamic required annotations parameters have
// been removed from the response

import { ProjectConfigurationDTO } from '../../../../src/core/configurable-parameters/dtos/configuration.interface';
import { project as detectionSegmentationProject } from '../../../mocks/detection-segmentation/mocks';

export const taskChainConfiguration = {
    global: [],
    task_chain: [
        {
            components: [
                {
                    description: 'Specify the number of required annotations for a task',
                    entity_identifier: {
                        component: 'DATASET_COUNTER',
                        project_id: '5d90b081a82ed851b5451c0f',
                        task_id: '5d90b081a82ed851b5451c12',
                        type: 'COMPONENT_PARAMETERS',
                        workspace_id: '20447f94-2f78-475f-9dcb-cb5445200570',
                    },
                    header: 'Annotation requirements',
                    id: '5d90b081d3a96168fe4cea29',
                    parameters: [
                        {
                            data_type: 'boolean',
                            default_value: false,
                            description: '',
                            editable: true,
                            header: 'Dynamic required annotations',
                            name: 'use_dynamic_required_annotations',
                            template_type: 'input',
                            ui_rules: {},
                            value: false,
                            warning: null,
                        },
                        {
                            value: 12,
                            default_value: 12,
                            description:
                                // eslint-disable-next-line max-len
                                'The minimum number of new annotations required before auto-train is triggered. Auto-training will start every time that this number of annotations is created.',
                            header: 'Number of images required for auto-training',
                            warning: null,
                            editable: true,
                            ui_rules: {},
                            min_value: 3,
                            max_value: 10000,
                            name: 'required_images_auto_training',
                            template_type: 'input',
                            data_type: 'integer',
                        },
                    ],
                    type: 'CONFIGURABLE_PARAMETERS',
                },
                {
                    description: 'General settings for a task.',
                    entity_identifier: {
                        component: 'TASK_NODE',
                        project_id: '5d90b081a82ed851b5451c0f',
                        task_id: '5d90b081a82ed851b5451c12',
                        type: 'COMPONENT_PARAMETERS',
                        workspace_id: '20447f94-2f78-475f-9dcb-cb5445200570',
                    },
                    header: 'General',
                    id: '5d90b081d3a96168fe4cea2e',
                    parameters: [
                        {
                            data_type: 'boolean',
                            default_value: true,
                            description: '',
                            editable: true,
                            header: 'Auto-training',
                            name: 'auto_training',
                            template_type: 'input',
                            ui_rules: {},
                            value: false,
                            warning: null,
                        },
                    ],
                    type: 'CONFIGURABLE_PARAMETERS',
                },
            ],
            task_id: '635fce72fc03e87df9becd10',
            task_title: 'Detection',
        },
        {
            components: [
                {
                    description: 'Specify the number of required annotations for a task',
                    entity_identifier: {
                        component: 'DATASET_COUNTER',
                        project_id: '5d90b081a82ed851b5451c0f',
                        task_id: '5d90b081a82ed851b5451c15',
                        type: 'COMPONENT_PARAMETERS',
                        workspace_id: '20447f94-2f78-475f-9dcb-cb5445200570',
                    },
                    header: 'Annotation requirements',
                    id: '5d90b081d3a96168fe4cea2a',
                    parameters: [
                        {
                            data_type: 'boolean',
                            default_value: false,
                            description: '',
                            editable: true,
                            header: 'Dynamic required annotations',
                            name: 'use_dynamic_required_annotations',
                            template_type: 'input',
                            ui_rules: {},
                            value: false,
                            warning: null,
                        },
                        {
                            value: 12,
                            default_value: 12,
                            description:
                                // eslint-disable-next-line max-len
                                'The minimum number of new annotations required before auto-train is triggered. Auto-training will start every time that this number of annotations is created.',
                            header: 'Number of images required for auto-training',
                            warning: null,
                            editable: true,
                            ui_rules: {},
                            min_value: 3,
                            max_value: 10000,
                            name: 'required_images_auto_training',
                            template_type: 'input',
                            data_type: 'integer',
                        },
                    ],
                    type: 'CONFIGURABLE_PARAMETERS',
                },
                {
                    description: 'General settings for a task.',
                    entity_identifier: {
                        component: 'TASK_NODE',
                        project_id: '5d90b081a82ed851b5451c0f',
                        task_id: '5d90b081a82ed851b5451c15',
                        type: 'COMPONENT_PARAMETERS',
                        workspace_id: '20447f94-2f78-475f-9dcb-cb5445200570',
                    },
                    header: 'General',
                    id: '5d90b081d3a96168fe4cea2f',
                    parameters: [
                        {
                            data_type: 'boolean',
                            default_value: true,
                            description: '',
                            editable: true,
                            header: 'Auto-training',
                            name: 'auto_training',
                            template_type: 'input',
                            ui_rules: {},
                            value: false,
                            warning: null,
                        },
                    ],
                    type: 'CONFIGURABLE_PARAMETERS',
                },
            ],
            task_id: '635fce72fc03e87df9becd12',
            task_title: 'Segmentation',
        },
    ],
};

export const projectConfiguration: ProjectConfigurationDTO = {
    task_configs: [
        {
            task_id: detectionSegmentationProject.pipeline.tasks[1].id,
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
            task_id: detectionSegmentationProject.pipeline.tasks[3].id,
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
