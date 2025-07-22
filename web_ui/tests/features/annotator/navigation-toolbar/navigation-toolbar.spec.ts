// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { clone } from 'lodash-es';

import {
    ProjectConfigurationDTO,
    ProjectConfigurationUploadPayloadDTO,
} from '../../../../src/core/configurable-parameters/dtos/configuration.interface';
import {
    getMockedProjectStatusDTO,
    getMockedProjectStatusTask,
} from '../../../../src/test-utils/mocked-items-factory/mocked-project';
import { annotatorTest as test } from '../../../fixtures/annotator-test';
import { OpenApiFixtures } from '../../../fixtures/open-api';
import { settings } from '../../../fixtures/open-api/mocks';
import { registerStoreSettings } from '../../../utils/api';
import { VIEWPORT_TYPE } from '../../../utils/test-type';
import { expect } from '../detection-segmentation/expect';
import {
    annotatorUrl,
    project as detectionSegmentationProject,
    userAnnotationsResponse,
} from './../../../mocks/detection-segmentation/mocks';
import { project as detectionProject } from './../../../mocks/detection/mocks';
import { projectConfiguration, taskChainConfiguration } from './mocks';

const registerProjectConfigurationEndpoints = (registerApiResponse: OpenApiFixtures['registerApiResponse']) => {
    const localProjectConfiguration = structuredClone(projectConfiguration);

    registerApiResponse('GetProjectConfiguration', (_, res, ctx) =>
        // @ts-expect-error Issue ie openapi types
        res(ctx.status(200), ctx.json(localProjectConfiguration))
    );

    registerApiResponse('UpdateProjectConfiguration', (req, res, ctx) => {
        const payload = req.body as unknown as ProjectConfigurationUploadPayloadDTO;

        const newTaskConfigs = localProjectConfiguration.task_configs.map((taskConfig) => {
            const existingTaskConfig = payload.task_configs.find(({ task_id }) => task_id === taskConfig.task_id);

            if (existingTaskConfig !== undefined) {
                return {
                    ...taskConfig,
                    training: {
                        constraints: taskConfig.training.constraints.map((constraint) => {
                            const payloadConstraint = existingTaskConfig.training?.constraints.find(
                                (c) => c.key === constraint.key
                            );
                            return {
                                ...constraint,
                                value: payloadConstraint ? payloadConstraint.value : constraint.value,
                            };
                        }),
                    },
                    auto_training: taskConfig.auto_training.map((autoTraining) => {
                        const payloadAutoTraining = existingTaskConfig.auto_training?.find(
                            (a) => a.key === autoTraining.key
                        );
                        return {
                            ...autoTraining,
                            value: payloadAutoTraining ? payloadAutoTraining.value : autoTraining.value,
                        };
                    }),
                };
            }

            return taskConfig;
        }) as ProjectConfigurationDTO['task_configs'];

        localProjectConfiguration.task_configs = newTaskConfigs;

        return res(ctx.status(200));
    });

    registerApiResponse('GetProjectStatus', (_, res, ctx) => {
        return res(
            // @ts-expect-error Issue ie openapi types
            ctx.json(
                getMockedProjectStatusDTO({
                    tasks: [
                        getMockedProjectStatusTask({
                            id: '635fce72fc03e87df9becd10',
                            title: 'Detection',
                            ready_to_train: true,
                        }),
                        getMockedProjectStatusTask({
                            id: '635fce72fc03e87df9becd12',
                            title: 'Segmentation',
                            ready_to_train: true,
                        }),
                    ],
                })
            )
        );
    });
};

// TODO: Remove once FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS is removed
const registerConfigurationEndpoints = (registerApiResponse: OpenApiFixtures['registerApiResponse']) => {
    const configuration = clone(taskChainConfiguration);

    registerApiResponse('GetFullConfiguration', (_, res, ctx) => {
        return res(ctx.json(configuration));
    });

    registerApiResponse('SetFullConfiguration', (req, res, ctx) => {
        req.body.task_chain.forEach((task, taskIdx) => {
            task.components.forEach((component, componentIdx) => {
                component.parameters?.forEach((parameter, parameterIdx) => {
                    configuration.task_chain[taskIdx].components[componentIdx].parameters[parameterIdx].value =
                        !!parameter.value;
                });
            });
        });

        return res(ctx.json(configuration));
    });

    registerApiResponse('GetProjectStatus', (_, res, ctx) => {
        return res(
            // @ts-expect-error Issue ie openapi types
            ctx.json(
                getMockedProjectStatusDTO({
                    tasks: [
                        getMockedProjectStatusTask({
                            id: '635fce72fc03e87df9becd10',
                            title: 'Detection',
                            ready_to_train: true,
                        }),
                        getMockedProjectStatusTask({
                            id: '635fce72fc03e87df9becd12',
                            title: 'Segmentation',
                            ready_to_train: true,
                        }),
                    ],
                })
            )
        );
    });
};

test.describe('navigation toolbar', () => {
    test.beforeEach(({ registerApiResponse }) => {
        registerApiResponse('GetProjectInfo', (_, res, ctx) => res(ctx.json(detectionSegmentationProject)));
        registerApiResponse('GetImageDetail', (_, res, ctx) => res(ctx.json({})));
    });

    test(`${VIEWPORT_TYPE.MOBILE} collapse sidebar`, async ({ page }) => {
        await page.goto(annotatorUrl);

        await expect(page.getByRole('button', { name: /Settings/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Jobs in progress/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Active learning configuration/i })).toBeVisible();
    });
});

test.describe('Active learning configuration', () => {
    test.beforeEach(async ({ registerApiResponse }) => {
        registerApiResponse('GetProjectInfo', (_, res, ctx) => res(ctx.json(detectionSegmentationProject)));

        registerApiResponse('GetImageAnnotation', (_, res, ctx) =>
            res(ctx.json({ ...userAnnotationsResponse, annotations: [] }))
        );

        registerApiResponse('GetImageAnnotation', (_, res, ctx) => {
            return res(ctx.json({ ...userAnnotationsResponse, annotations: [] }));
        });

        registerProjectConfigurationEndpoints(registerApiResponse);
    });

    test('It allows the user to toggle suggesting predictions', async ({
        page,
        registerApiResponse,
        annotationListPage,
        aiLearningConfigurationPage,
    }) => {
        registerStoreSettings(registerApiResponse, JSON.parse(settings));

        // Verify predictions are suggested
        await page.goto(annotatorUrl);
        await annotationListPage.expectTotalAnnotationsToBe(1);

        let inferenceIsCalled = false;

        registerApiResponse('GetSinglePrediction', (_, res, ctx) => {
            inferenceIsCalled = true;

            return res(ctx.status(204));
        });

        // Disable suggested predictions
        await aiLearningConfigurationPage.open();
        await aiLearningConfigurationPage.toggleSuggestPredictions();

        // Reload page to see that predictions are no longer suggested
        await page.goto(annotatorUrl);
        await annotationListPage.expectTotalAnnotationsToBe(0);
        expect(inferenceIsCalled).toBe(false);
    });

    test('It allows the user to manage training configuration of a task', async ({
        page,
        taskNavigation,
        aiLearningConfigurationPage,
        registerApiResponse,
    }) => {
        registerConfigurationEndpoints(registerApiResponse);

        await page.goto(annotatorUrl);

        await expect(page.getByRole('button', { name: 'Detection', exact: true })).toBeVisible();

        await aiLearningConfigurationPage.open();

        // Check that we can change training settings for both tasks
        await aiLearningConfigurationPage.taskPicker().click();
        await expect(page.getByRole('option', { name: 'Detection' })).toBeVisible();
        await expect(page.getByRole('option', { name: 'Segmentation' })).toBeVisible();
        await page.keyboard.press('Escape');

        // When auto training is turned on we don't allow manual training from this page
        await expect(aiLearningConfigurationPage.startTrainingButton()).toBeEnabled();
        await aiLearningConfigurationPage.toggleAutoTraining();
        await expect(aiLearningConfigurationPage.startTrainingButton()).toBeDisabled();

        // Close
        await page.keyboard.press('Escape');

        // Go to a specific task and check that we can only see the settings for that task
        await taskNavigation.selectTaskMode('Segmentation');
        await aiLearningConfigurationPage.open();
        await expect(aiLearningConfigurationPage.taskPicker()).toBeHidden();
        await expect(aiLearningConfigurationPage.startTrainingButton()).toBeEnabled();
        await aiLearningConfigurationPage.toggleAutoTraining();
        await aiLearningConfigurationPage.selectAdaptiveAnnotationsThreshold();

        // Refresh to see that we persisted the auto training settings
        await page.goto(annotatorUrl);
        await aiLearningConfigurationPage.open();
        await expect(aiLearningConfigurationPage.autoTrainingSwitch()).toBeChecked();
        await expect(aiLearningConfigurationPage.adaptiveRequiredAnnotationsRadio()).not.toBeChecked();
        await expect(aiLearningConfigurationPage.startTrainingButton()).toBeDisabled();
    });

    test.describe('Single task', () => {
        test.beforeEach(async ({ registerApiResponse }) => {
            registerApiResponse('GetProjectInfo', (_, res, ctx) => res(ctx.json(detectionProject)));
        });

        test('It does not show a picker for single task projects', async ({
            page,
            registerApiResponse,
            aiLearningConfigurationPage,
        }) => {
            registerConfigurationEndpoints(registerApiResponse);
            await page.goto(annotatorUrl);
            await aiLearningConfigurationPage.open();

            // Check that we can change training settings for both tasks
            await expect(aiLearningConfigurationPage.taskPicker()).toBeHidden();
        });
    });
});
