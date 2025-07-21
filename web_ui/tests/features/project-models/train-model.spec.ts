// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { Page } from '@playwright/test';

import {
    getMockedProjectStatusDTO,
    getMockedProjectStatusTask,
} from '../../../src/test-utils/mocked-items-factory/mocked-project';
import { expect, test } from '../../fixtures/base-test';
import { project as detectionSegmentationProject } from '../../mocks/detection-segmentation/mocks';
import { project as detectionProject } from '../../mocks/detection/mocks';
import { expectedTrainingConfiguration, supportedAlgorithms, trainingConfiguration } from './mocks';

const expectSubsetSizes = async (
    page: Page,
    {
        trainingSize,
        validationSize,
        testSize,
    }: {
        trainingSize: number;
        testSize: number;
        validationSize: number;
    }
) => {
    await expect(page.getByLabel('Training subset size')).toHaveText(new RegExp(trainingSize.toString()));
    await expect(page.getByLabel('Validation subset size')).toHaveText(new RegExp(validationSize.toString()));
    await expect(page.getByLabel('Test subset size')).toHaveText(new RegExp(testSize.toString()));
};

const expectTrainingSubsetsDistribution = async (
    page: Page,
    {
        trainingSubset,
        validationSubset,
        testSubset,
    }: {
        trainingSubset: number;
        validationSubset: number;
        testSubset: number;
    }
) => {
    await expect(page.getByLabel('Training subsets tag')).toHaveText(
        `${trainingSubset}/${validationSubset}/${testSubset}%`
    );
    await expect(page.getByLabel('Training subsets distribution')).toHaveText(
        `${trainingSubset}/${validationSubset}/${testSubset}%`
    );
};

const expectTaskSelectorToBeVisible = async (page: Page) => {
    await expect(page.getByRole('button', { name: /select domain task/i })).toBeVisible();
};

const expectTaskSelectorToBeHidden = async (page: Page) => {
    await expect(page.getByRole('button', { name: /select domain task/i })).toBeHidden();
};

test.describe('Train model', () => {
    test.use({
        featureFlags: {
            FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS: true,
            FEATURE_FLAG_CREDIT_SYSTEM: false,
        },
    });

    test.beforeEach(({ registerApiResponse }) => {
        registerApiResponse('GetTrainingConfiguration', (_, res, ctx) => {
            // @ts-expect-error Issue in openapi types
            return res(ctx.status(200), ctx.json(trainingConfiguration));
        });

        registerApiResponse('GetSupportedAlgorithms', (_, res, ctx) => {
            return res(ctx.json(supportedAlgorithms));
        });

        registerApiResponse('GetModelGroups', (_, res, ctx) => {
            return res(
                ctx.json({
                    model_groups: [],
                })
            );
        });
    });

    test.describe('Single task', () => {
        // eslint-disable-next-line max-len
        const modelsURL = `http://localhost:3000/organizations/5b1f89f3-aba5-4a5f-84ab-de9abb8e0633/workspaces/61011e42d891c82e13ec92da/projects/${detectionProject.id}/models`;

        test.beforeEach(({ registerApiResponse }) => {
            registerApiResponse('GetProjectInfo', (_, res, ctx) => {
                return res(ctx.json(detectionProject));
            });

            registerApiResponse('GetProjectStatus', (_, res, ctx) => {
                return res(
                    // @ts-expect-error Issue ie openapi types
                    ctx.json(
                        getMockedProjectStatusDTO({
                            tasks: [
                                getMockedProjectStatusTask({
                                    id: detectionProject.pipeline.tasks[1].id,
                                    ready_to_train: true,
                                }),
                            ],
                        })
                    )
                );
            });
        });

        test('Trains model in a basic mode', async ({ page, modelsPage }) => {
            await page.goto(modelsURL);

            const trainModelPage = await modelsPage.openTrainDialog();

            await expectTaskSelectorToBeHidden(page);

            await trainModelPage.selectModelTemplate('Speed');

            const trainModelPromise = page.waitForRequest((request) => {
                return request.method() === 'POST' && request.url().endsWith(':train');
            });

            await trainModelPage.train();

            const trainModelRequestPayload = (await trainModelPromise).postDataJSON();

            expect(trainModelRequestPayload).toEqual({
                train_from_scratch: false,
                reshuffle_subsets: false,
                model_template_id: 'Object_Detection_YOLOX_S',
                task_id: detectionProject.pipeline.tasks[1].id,
            });
        });

        test('Trains model in an advanced mode', async ({ page, modelsPage }) => {
            await page.goto(modelsURL);

            const trainModelPage = await modelsPage.openTrainDialog();

            await trainModelPage.advancedSettings();
            await trainModelPage.selectModelAlgorithm('ATSS-MobileNetV2');
            await trainModelPage.selectTab('Data management');

            await expectTrainingSubsetsDistribution(page, {
                testSubset: 10,
                validationSubset: 20,
                trainingSubset: 70,
            });
            await expectSubsetSizes(page, {
                testSize: 10,
                validationSize: 20,
                trainingSize: 71,
            });

            await trainModelPage.changeSubsetRange('start', 10);
            await trainModelPage.changeSubsetRange('end', 5);

            await expectTrainingSubsetsDistribution(page, {
                testSubset: 15,
                validationSubset: 25,
                trainingSubset: 60,
            });
            await expectSubsetSizes(page, {
                testSize: 15,
                validationSize: 25,
                trainingSize: 61,
            });

            await trainModelPage.changeNumberParameter('Tile size', 128);
            await expect(trainModelPage.getNumberParameter('Tile size')).toHaveValue('128');

            await expect(trainModelPage.getBooleanParameter('Enable center crop')).toBeChecked();
            await expect(trainModelPage.getNumberParameter('Crop ratio')).toBeEnabled();

            await trainModelPage.toggleEnableParameter('Enable center crop');
            await expect(trainModelPage.getBooleanParameter('Enable center crop')).not.toBeChecked();
            await expect(trainModelPage.getNumberParameter('Crop ratio')).toBeDisabled();

            await expect(trainModelPage.getToggleFilter('Minimum annotation pixels')).toBeChecked();
            await expect(trainModelPage.getNumberParameter('Minimum annotation pixels')).toBeDisabled();

            await trainModelPage.toggleFilter('Minimum annotation pixels');

            await expect(trainModelPage.getToggleFilter('Minimum annotation pixels')).not.toBeChecked();
            await expect(trainModelPage.getNumberParameter('Minimum annotation pixels')).toBeEnabled();

            await expect(trainModelPage.getTag('Filters tag')).toHaveText('On');

            await trainModelPage.resetParameterToDefault('Minimum annotation pixels');

            await expect(trainModelPage.getTag('Filters tag')).toHaveText('Off');

            await expect(trainModelPage.getToggleFilter('Minimum annotation pixels')).toBeChecked();
            await expect(trainModelPage.getNumberParameter('Minimum annotation pixels')).toBeDisabled();

            await trainModelPage.selectTab('Training');

            await expect(trainModelPage.getFineTuneParameter('Previous training weights')).toBeChecked();
            await expect(trainModelPage.getTag('Fine-tune parameters tag')).toHaveText('Previous training weights');

            await expect(trainModelPage.getFineTuneParameter('Pre-trained weights')).not.toBeChecked();
            await expect(trainModelPage.getReshuffleSubsets()).toBeDisabled();

            await trainModelPage.selectFineTuneParameter('Pre-trained weights');

            await expect(trainModelPage.getFineTuneParameter('Pre-trained weights')).toBeChecked();
            await expect(trainModelPage.getTag('Fine-tune parameters tag')).toHaveText('Pre-trained weights');
            await expect(trainModelPage.getReshuffleSubsets()).toBeEnabled();

            await trainModelPage.toggleReshuffleSubsets();
            await expect(trainModelPage.getReshuffleSubsets()).toBeChecked();

            await trainModelPage.selectFineTuneParameter('Previous training weights');
            await expect(trainModelPage.getReshuffleSubsets()).toBeDisabled();
            await expect(trainModelPage.getReshuffleSubsets()).not.toBeChecked();

            await trainModelPage.selectFineTuneParameter('Pre-trained weights');
            await trainModelPage.toggleReshuffleSubsets();

            await expect(trainModelPage.getTag('Learning parameters tag')).toHaveText('Default');

            await trainModelPage.changeNumberParameter('Maximum epochs', 250);
            await expect(trainModelPage.getNumberParameter('Maximum epochs')).toHaveValue('250');

            await expect(trainModelPage.getNumberParameter('Patience')).toBeEnabled();
            await expect(trainModelPage.getBooleanParameter('Enable early stopping')).toBeChecked();

            await trainModelPage.toggleEnableParameter('Enable early stopping');

            await expect(trainModelPage.getNumberParameter('Patience')).toBeDisabled();

            await expect(trainModelPage.getTag('Learning parameters tag')).toHaveText('Modified');

            const trainingConfigurationPromise = page.waitForRequest((request) => {
                return request.method() === 'PATCH' && request.url().includes('training_configuration');
            });
            const trainModelPromise = page.waitForRequest((request) => {
                return request.method() === 'POST' && request.url().endsWith(':train');
            });

            await trainModelPage.train();

            const trainingConfigurationPayload = (await trainingConfigurationPromise).postDataJSON();
            const trainModelRequestPayload = (await trainModelPromise).postDataJSON();

            expect(trainingConfigurationPayload).toEqual(expectedTrainingConfiguration);

            expect(trainModelRequestPayload).toEqual({
                train_from_scratch: true,
                reshuffle_subsets: true,
                model_template_id: 'Custom_Object_Detection_Gen3_ATSS',
                task_id: detectionProject.pipeline.tasks[1].id,
            });
        });

        test('Resets training configuration to default when model template is changed', async ({
            page,
            modelsPage,
        }) => {
            await page.goto(modelsURL);

            const trainModelPage = await modelsPage.openTrainDialog();

            await trainModelPage.advancedSettings();
            await trainModelPage.selectModelAlgorithm('ATSS-MobileNetV2');

            await trainModelPage.selectTab('Data management');

            await trainModelPage.changeSubsetRange('start', 10);
            await expectTrainingSubsetsDistribution(page, {
                testSubset: 10,
                validationSubset: 30,
                trainingSubset: 60,
            });

            await trainModelPage.selectTab('Training');

            await trainModelPage.selectFineTuneParameter('Pre-trained weights');
            await trainModelPage.toggleReshuffleSubsets();

            await expect(trainModelPage.getFineTuneParameter('Pre-trained weights')).toBeChecked();
            await expect(trainModelPage.getReshuffleSubsets()).toBeChecked();

            await trainModelPage.selectTab('Architecture');
            await trainModelPage.selectModelAlgorithm('DFine-X');

            await trainModelPage.selectTab('Data management');

            await expectTrainingSubsetsDistribution(page, {
                testSubset: 10,
                validationSubset: 20,
                trainingSubset: 70,
            });

            await trainModelPage.selectTab('Training');

            await expect(trainModelPage.getFineTuneParameter('Pre-trained weights')).not.toBeChecked();
            await expect(trainModelPage.getReshuffleSubsets()).toBeDisabled();
        });
    });

    test.describe('Task chain', () => {
        // eslint-disable-next-line max-len
        const modelsURL = `http://localhost:3000/organizations/5b1f89f3-aba5-4a5f-84ab-de9abb8e0633/workspaces/61011e42d891c82e13ec92da/projects/${detectionSegmentationProject.id}/models`;

        test.beforeEach(({ registerApiResponse }) => {
            registerApiResponse('GetProjectInfo', (_, res, ctx) => {
                return res(ctx.json(detectionSegmentationProject));
            });

            registerApiResponse('GetProjectStatus', (_, res, ctx) => {
                return res(
                    // @ts-expect-error Issue ie openapi types
                    ctx.json(
                        getMockedProjectStatusDTO({
                            tasks: [
                                getMockedProjectStatusTask({
                                    id: detectionSegmentationProject.pipeline.tasks[1].id,
                                    ready_to_train: true,
                                }),
                                getMockedProjectStatusTask({
                                    id: detectionSegmentationProject.pipeline.tasks[3].id,
                                    ready_to_train: true,
                                }),
                            ],
                        })
                    )
                );
            });
        });

        test('Trains model in a basic mode', async ({ page, modelsPage }) => {
            await page.goto(modelsURL);

            const trainModelPage = await modelsPage.openTrainDialog();
            await expectTaskSelectorToBeVisible(page);

            await trainModelPage.selectTaskType('segmentation');

            await trainModelPage.selectModelTemplate('Balance');

            const trainModelPromise = page.waitForRequest((request) => {
                return request.method() === 'POST' && request.url().endsWith(':train');
            });

            await trainModelPage.train();

            const trainModelRequestPayload = (await trainModelPromise).postDataJSON();

            expect(trainModelRequestPayload).toEqual({
                train_from_scratch: false,
                reshuffle_subsets: false,
                model_template_id: 'Custom_Semantic_Segmentation_Lite-HRNet-18-mod2_OCR',
                task_id: detectionSegmentationProject.pipeline.tasks[3].id,
            });
        });

        test('Trains model in an advanced mode', async ({ page, modelsPage }) => {
            await page.goto(modelsURL);

            const trainModelPage = await modelsPage.openTrainDialog();
            await expectTaskSelectorToBeVisible(page);

            await trainModelPage.selectTaskType('segmentation');

            await trainModelPage.advancedSettings();
            await trainModelPage.selectModelAlgorithm('LiteHRNet-18');
            await trainModelPage.selectTab('Data management');

            await expectTrainingSubsetsDistribution(page, {
                testSubset: 10,
                validationSubset: 20,
                trainingSubset: 70,
            });
            await expectSubsetSizes(page, {
                testSize: 10,
                validationSize: 20,
                trainingSize: 71,
            });

            await trainModelPage.changeSubsetRange('start', 10);
            await trainModelPage.changeSubsetRange('end', 5);

            await expectTrainingSubsetsDistribution(page, {
                testSubset: 15,
                validationSubset: 25,
                trainingSubset: 60,
            });
            await expectSubsetSizes(page, {
                testSize: 15,
                validationSize: 25,
                trainingSize: 61,
            });

            await trainModelPage.changeNumberParameter('Tile size', 128);
            await expect(trainModelPage.getNumberParameter('Tile size')).toHaveValue('128');

            await expect(trainModelPage.getBooleanParameter('Enable center crop')).toBeChecked();
            await expect(trainModelPage.getNumberParameter('Crop ratio')).toBeEnabled();

            await trainModelPage.toggleEnableParameter('Enable center crop');
            await expect(trainModelPage.getBooleanParameter('Enable center crop')).not.toBeChecked();
            await expect(trainModelPage.getNumberParameter('Crop ratio')).toBeDisabled();

            await expect(trainModelPage.getToggleFilter('Minimum annotation pixels')).toBeChecked();
            await expect(trainModelPage.getNumberParameter('Minimum annotation pixels')).toBeDisabled();

            await trainModelPage.toggleFilter('Minimum annotation pixels');

            await expect(trainModelPage.getToggleFilter('Minimum annotation pixels')).not.toBeChecked();
            await expect(trainModelPage.getNumberParameter('Minimum annotation pixels')).toBeEnabled();

            await expect(trainModelPage.getTag('Filters tag')).toHaveText('On');

            await trainModelPage.resetParameterToDefault('Minimum annotation pixels');

            await expect(trainModelPage.getTag('Filters tag')).toHaveText('Off');

            await expect(trainModelPage.getToggleFilter('Minimum annotation pixels')).toBeChecked();
            await expect(trainModelPage.getNumberParameter('Minimum annotation pixels')).toBeDisabled();

            await trainModelPage.selectTab('Training');

            await expect(trainModelPage.getFineTuneParameter('Previous training weights')).toBeChecked();
            await expect(trainModelPage.getTag('Fine-tune parameters tag')).toHaveText('Previous training weights');

            await expect(trainModelPage.getFineTuneParameter('Pre-trained weights')).not.toBeChecked();
            await expect(trainModelPage.getReshuffleSubsets()).toBeDisabled();

            await trainModelPage.selectFineTuneParameter('Pre-trained weights');

            await expect(trainModelPage.getFineTuneParameter('Pre-trained weights')).toBeChecked();
            await expect(trainModelPage.getTag('Fine-tune parameters tag')).toHaveText('Pre-trained weights');
            await expect(trainModelPage.getReshuffleSubsets()).toBeEnabled();

            await trainModelPage.toggleReshuffleSubsets();
            await expect(trainModelPage.getReshuffleSubsets()).toBeChecked();

            await trainModelPage.selectFineTuneParameter('Previous training weights');
            await expect(trainModelPage.getReshuffleSubsets()).toBeDisabled();
            await expect(trainModelPage.getReshuffleSubsets()).not.toBeChecked();

            await trainModelPage.selectFineTuneParameter('Pre-trained weights');
            await trainModelPage.toggleReshuffleSubsets();

            await expect(trainModelPage.getTag('Learning parameters tag')).toHaveText('Default');

            await trainModelPage.changeNumberParameter('Maximum epochs', 250);
            await expect(trainModelPage.getNumberParameter('Maximum epochs')).toHaveValue('250');

            await expect(trainModelPage.getNumberParameter('Patience')).toBeEnabled();
            await expect(trainModelPage.getBooleanParameter('Enable early stopping')).toBeChecked();

            await trainModelPage.toggleEnableParameter('Enable early stopping');

            await expect(trainModelPage.getNumberParameter('Patience')).toBeDisabled();

            await expect(trainModelPage.getTag('Learning parameters tag')).toHaveText('Modified');

            const trainingConfigurationPromise = page.waitForRequest((request) => {
                return request.method() === 'PATCH' && request.url().includes('training_configuration');
            });
            const trainModelPromise = page.waitForRequest((request) => {
                return request.method() === 'POST' && request.url().endsWith(':train');
            });

            await trainModelPage.train();

            const trainingConfigurationPayload = (await trainingConfigurationPromise).postDataJSON();
            const trainModelRequestPayload = (await trainModelPromise).postDataJSON();

            expect(trainingConfigurationPayload).toEqual(expectedTrainingConfiguration);

            expect(trainModelRequestPayload).toEqual({
                train_from_scratch: true,
                reshuffle_subsets: true,
                model_template_id: 'Custom_Semantic_Segmentation_Lite-HRNet-18-mod2_OCR',
                task_id: detectionSegmentationProject.pipeline.tasks[3].id,
            });
        });

        test('Resets training configuration to default when model template is changed', async ({
            page,
            modelsPage,
        }) => {
            await page.goto(modelsURL);

            const trainModelPage = await modelsPage.openTrainDialog();
            await expectTaskSelectorToBeVisible(page);

            await trainModelPage.selectTaskType('segmentation');

            await trainModelPage.advancedSettings();
            await trainModelPage.selectModelAlgorithm('LiteHRNet-18');

            await trainModelPage.selectTab('Data management');

            await trainModelPage.changeSubsetRange('start', 10);
            await expectTrainingSubsetsDistribution(page, {
                testSubset: 10,
                validationSubset: 30,
                trainingSubset: 60,
            });

            await trainModelPage.selectTab('Training');

            await trainModelPage.selectFineTuneParameter('Pre-trained weights');
            await trainModelPage.toggleReshuffleSubsets();

            await expect(trainModelPage.getFineTuneParameter('Pre-trained weights')).toBeChecked();
            await expect(trainModelPage.getReshuffleSubsets()).toBeChecked();

            await trainModelPage.selectTab('Architecture');
            await trainModelPage.selectModelAlgorithm('SegNext-S');

            await trainModelPage.selectTab('Data management');

            await expectTrainingSubsetsDistribution(page, {
                testSubset: 10,
                validationSubset: 20,
                trainingSubset: 70,
            });

            await trainModelPage.selectTab('Training');

            await expect(trainModelPage.getFineTuneParameter('Pre-trained weights')).not.toBeChecked();
            await expect(trainModelPage.getReshuffleSubsets()).toBeDisabled();
        });
    });
});
