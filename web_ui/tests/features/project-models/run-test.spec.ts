// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { orderBy } from 'lodash-es';

import { expect, test } from '../../fixtures/base-test';
import { ProjectModelsPage } from '../../fixtures/page-objects/models-page';
import { TestConfiguration } from '../../fixtures/page-objects/run-test-dialog-page';
import { project } from '../../mocks/detection/mocks';
import { expectTestConfiguration } from './../project-tests/expect';
import { legacyTestWithModels } from './fixtures';
import { supportedAlgorithms } from './mocks';
import { getModelDetail, getModelGroup, getModelGroups } from './models.mocks';

const MODELS_URL =
    // eslint-disable-next-line max-len
    '/organizations/5b1f89f3-aba5-4a5f-84ab-de9abb8e0633/workspaces/61011e42d891c82e13ec92da/projects/63283aedc80c9c686fd3b1e6/models';

interface RunTestFixtures {
    modelsPage: ProjectModelsPage;
}

const legacyTest = legacyTestWithModels.extend<RunTestFixtures>({
    modelsPage: async ({ registerApiResponse, modelsPage }, use) => {
        let hasBeenCalled = false;
        registerApiResponse('TriggerModelTestJob', (_, res, ctx) => {
            hasBeenCalled = true;

            return res(ctx.status(201));
        });

        await use(modelsPage);

        expect(hasBeenCalled).toEqual(true);
    },
});

legacyTest.describe('Run tests FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS: false', () => {
    legacyTest.use({
        featureFlags: {
            FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS: false,
        },
    });

    legacyTest('Run tests from models index page', async ({ page, modelsPage }) => {
        await page.goto(MODELS_URL);
        const runTestDialogPage = await modelsPage.openTestDialog('EfficientNet-B0', '2');

        const configuration: TestConfiguration = {
            optimization: 'OpenVINO',
            dataset: 'dataset',
        };
        await runTestDialogPage.configureTest(configuration);

        await expectTestConfiguration(page, { ...configuration, version: 'Version 2', model: 'EfficientNet-B0' });

        await runTestDialogPage.runTest();
        await modelsPage.seeTestProgress();
    });

    legacyTest('Run tests from model page', async ({ page, modelsPage }) => {
        await page.goto(MODELS_URL);

        const modelPage = await modelsPage.goToModel('EfficientNet-B0', '2');

        const runTestDialogPage = await modelPage.openTestDialog('EfficientNet-B0 OpenVINO');

        const configuration: TestConfiguration = { dataset: 'dataset' };
        await runTestDialogPage.configureTest(configuration);
        await expectTestConfiguration(page, {
            ...configuration,
            optimization: 'OpenVINO',
            version: 'Version 2',
            model: getModelDetail.name,
        });

        await runTestDialogPage.runTest();
        await modelsPage.seeTestProgress();
    });
});

test.describe('Run tests FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS: true', () => {
    test.use({
        featureFlags: {
            FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS: true,
        },
    });

    test.beforeEach(({ registerApiResponse }) => {
        registerApiResponse('GetSupportedAlgorithms', (_, res, ctx) => {
            return res(ctx.json(supportedAlgorithms));
        });

        registerApiResponse('GetProjectInfo', (_, res, ctx) => {
            return res(ctx.json(project));
        });

        registerApiResponse('GetModelGroups', (_, res, ctx) => {
            const task = (project.pipeline?.tasks ?? []).find(({ task_type }) => task_type !== 'dataset');

            const algorithmsPerTask =
                supportedAlgorithms.supported_algorithms?.filter(
                    ({ task: taskType }) => taskType === task?.task_type
                ) ?? [];

            const sortedAlgorithms = orderBy(algorithmsPerTask, 'gigaflops', 'asc');

            const model_groups = getModelGroups.model_groups?.map((modelGroup) => {
                return { ...modelGroup, task_id: task?.id, model_template_id: sortedAlgorithms[0].model_manifest_id };
            });

            return res(ctx.status(200), ctx.json({ model_groups }));
        });

        registerApiResponse('GetModelGroup', (_, res, ctx) => {
            return res(ctx.status(200), ctx.json(getModelGroup));
        });

        registerApiResponse('GetModelDetail', (_, res, ctx) => {
            return res(ctx.status(200), ctx.json(getModelDetail));
        });
    });

    test('Run tests from models index page', async ({ page, modelsPage }) => {
        await page.goto(MODELS_URL);

        const runTestDialogPage = await modelsPage.openTestDialog('EfficientNet-B0', '2');

        const configuration: TestConfiguration = {
            optimization: 'OpenVINO',
            dataset: 'dataset',
        };
        await runTestDialogPage.configureTest(configuration);

        await expectTestConfiguration(page, { ...configuration, version: 'Version 2', model: 'EfficientNet-B0' });

        await runTestDialogPage.runTest();
        await modelsPage.seeTestProgress();
    });

    test('Run tests from model page', async ({ page, modelsPage }) => {
        await page.goto(MODELS_URL);

        const modelPage = await modelsPage.goToModel('EfficientNet-B0', '2');

        const runTestDialogPage = await modelPage.openTestDialog('EfficientNet-B0 OpenVINO');

        const configuration: TestConfiguration = { dataset: 'dataset' };
        await runTestDialogPage.configureTest(configuration);
        await expectTestConfiguration(page, {
            ...configuration,
            optimization: 'OpenVINO',
            version: 'Version 2',
            model: getModelDetail.name,
        });

        await runTestDialogPage.runTest();
        await modelsPage.seeTestProgress();
    });
});
