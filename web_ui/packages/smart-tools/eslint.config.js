// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import sharedConfig from '@geti/config/lint';

export default [
    ...sharedConfig,
    {
        ignores: ['./src/opencv/interfaces']
    },
    {
        files: ['./index.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['@geti/smart-tools'],
                            message: 'Importing files from @geti/smart-tools is not allowed.',
                        },
                        {
                            group: ['../**/*'],
                            message: 'Importing files outside of the current package is not allowed.',
                        },
                    ],
                },
            ],
        },
    },
];
