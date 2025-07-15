// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { expectProjectToHaveLabels, expectProjectToHaveType } from './expect';
import { testWithOpenApi as test } from './fixtures';

test.describe('Anomaly project creation', () => {
    test('Create anomaly detection project', async ({ createProjectPage }) => {
        const projectPage = await createProjectPage.anomalyDetection('Playwright Cat & Dog anomaly detection');

        await expectProjectToHaveType(projectPage, 'Anomaly detection');
        await expectProjectToHaveLabels(projectPage, ['Normal', 'Anomalous']);
    });
});
