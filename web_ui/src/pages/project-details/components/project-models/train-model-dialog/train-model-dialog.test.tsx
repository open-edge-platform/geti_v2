// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { fireEvent, screen, waitFor } from '@testing-library/react';

import { createApiModelConfigParametersService } from '../../../../../core/configurable-parameters/services/api-model-config-parameters-service';
import { ModelsGroups } from '../../../../../core/models/models.interface';
import { createInMemoryModelsService } from '../../../../../core/models/services/in-memory-models-service';
import { DOMAIN } from '../../../../../core/projects/core.interface';
import { ProjectProps } from '../../../../../core/projects/project.interface';
import { createInMemoryProjectService } from '../../../../../core/projects/services/in-memory-project-service';
import { PerformanceCategory } from '../../../../../core/supported-algorithms/dtos/supported-algorithms.interface';
import { createInMemorySupportedAlgorithmsService } from '../../../../../core/supported-algorithms/services/in-memory-supported-algorithms-service';
import { idMatchingFormat } from '../../../../../test-utils/id-utils';
import {
    getMockedConfigurationParameter,
    getMockedTrainingConfiguration,
} from '../../../../../test-utils/mocked-items-factory/mocked-configuration-parameters';
import {
    getMockedModelsGroup,
    getMockedModelVersion,
} from '../../../../../test-utils/mocked-items-factory/mocked-model';
import {
    getMockedProject,
    getMockedProjectStatus,
    getMockedProjectStatusTask,
} from '../../../../../test-utils/mocked-items-factory/mocked-project';
import { getMockedSupportedAlgorithm } from '../../../../../test-utils/mocked-items-factory/mocked-supported-algorithms';
import { getMockedTask } from '../../../../../test-utils/mocked-items-factory/mocked-tasks';
import { projectRender as render } from '../../../../../test-utils/project-provider-render';
import { CustomRenderOptions } from '../../../../../test-utils/required-providers-render';
import { TrainModel } from './train-model-dialog.component';

const mockedSingleProject = getMockedProject({
    id: 'singleProject',
    tasks: [
        getMockedTask({
            id: 'taskId',
            domain: DOMAIN.DETECTION,
        }),
    ],
});

const mockedTaskChainProject = getMockedProject({
    id: 'taskChainProject',
    tasks: [
        getMockedTask({
            id: 'taskId',
            domain: DOMAIN.DETECTION,
        }),
        getMockedTask({
            id: 'taskId2',
            domain: DOMAIN.CLASSIFICATION,
        }),
    ],
});

const mockedSupportedAlgorithms = [
    getMockedSupportedAlgorithm({
        name: 'YOLO detection',
        domain: DOMAIN.DETECTION,
        modelTemplateId: 'detection_yolo_detection',
        gigaflops: 1.3,
        description: 'YOLO architecture for detection',
        isDefaultAlgorithm: true,
        performanceCategory: PerformanceCategory.ACCURACY,
    }),
    getMockedSupportedAlgorithm({
        name: 'SSD detection',
        domain: DOMAIN.DETECTION,
        modelTemplateId: 'detection_ssd_detection',
        gigaflops: 5.4,
        description: 'SSD architecture for detection',
        isDefaultAlgorithm: false,
        performanceCategory: PerformanceCategory.SPEED,
    }),
    getMockedSupportedAlgorithm({
        name: 'ATTS detection',
        domain: DOMAIN.DETECTION,
        modelTemplateId: 'detection_atts_detection',
        gigaflops: 3,
        description: 'ATTS architecture for detection',
        isDefaultAlgorithm: false,
        performanceCategory: PerformanceCategory.BALANCE,
    }),
    getMockedSupportedAlgorithm({
        name: 'ATTS2 detection',
        domain: DOMAIN.DETECTION,
        modelTemplateId: 'detection_atts2_detection',
        gigaflops: 3,
        description: 'ATTS2 architecture for detection',
        isDefaultAlgorithm: false,
        performanceCategory: PerformanceCategory.OTHER,
    }),

    getMockedSupportedAlgorithm({
        name: 'YOLO classification',
        domain: DOMAIN.CLASSIFICATION,
        modelTemplateId: 'classification_yolo_classification',
        gigaflops: 1.3,
        description: 'YOLO architecture for classification',
        isDefaultAlgorithm: false,
        performanceCategory: PerformanceCategory.ACCURACY,
    }),
    getMockedSupportedAlgorithm({
        name: 'SSD classification',
        domain: DOMAIN.CLASSIFICATION,
        modelTemplateId: 'classification_ssd_classification',
        gigaflops: 5.4,
        description: 'SSD architecture for classification',
        isDefaultAlgorithm: true,
        performanceCategory: PerformanceCategory.BALANCE,
    }),
    getMockedSupportedAlgorithm({
        name: 'ATTS classification',
        domain: DOMAIN.CLASSIFICATION,
        modelTemplateId: 'classification_atts_classification',
        gigaflops: 3,
        description: 'ATTS architecture for classification',
        isDefaultAlgorithm: false,
        performanceCategory: PerformanceCategory.SPEED,
    }),
    getMockedSupportedAlgorithm({
        name: 'ATTS2 classification',
        domain: DOMAIN.CLASSIFICATION,
        modelTemplateId: 'classification_atts2_classification',
        gigaflops: 3,
        description: 'ATTS2 architecture for classification',
        isDefaultAlgorithm: false,
        performanceCategory: PerformanceCategory.OTHER,
    }),
];

const getDefaultModelTemplate = (domain: DOMAIN) => {
    return mockedSupportedAlgorithms.find((algorithm) => {
        return algorithm.isDefaultAlgorithm && algorithm.domain === domain;
    });
};

const renderTrainModelDialog = async ({
    onClose = jest.fn(),
    onSuccess = jest.fn(),
    project = mockedSingleProject,
    services,
}: {
    onSuccess?: () => void;
    onClose?: () => void;
    services?: CustomRenderOptions['services'];
    project?: ProjectProps;
    models?: ModelsGroups[];
} = {}) => {
    const supportedAlgorithmsService = createInMemorySupportedAlgorithmsService();
    const modelsService = createInMemoryModelsService();
    const projectService = createInMemoryProjectService();

    projectService.getProject = jest.fn(async () => project);

    projectService.getProjectStatus = () =>
        Promise.resolve(
            getMockedProjectStatus({
                tasks: project.tasks.map((task) =>
                    getMockedProjectStatusTask({
                        id: task.id,
                        ready_to_train: true,
                    })
                ),
            })
        );

    supportedAlgorithmsService.getProjectSupportedAlgorithms = jest.fn(async () => mockedSupportedAlgorithms);

    const defaultModelTemplateDetection = getDefaultModelTemplate(DOMAIN.DETECTION);
    const defaultModelTemplateClassification = getDefaultModelTemplate(DOMAIN.CLASSIFICATION);

    modelsService.getModels = jest.fn(async () => [
        getMockedModelsGroup({
            taskId: project.tasks[0].id,
            modelTemplateId: defaultModelTemplateDetection?.modelTemplateId,
            modelTemplateName: defaultModelTemplateDetection?.templateName,
            modelVersions: [getMockedModelVersion({ isActiveModel: true })],
        }),
        getMockedModelsGroup({
            taskId: project.tasks[1].id,
            modelTemplateId: defaultModelTemplateClassification?.modelTemplateId,
            modelTemplateName: defaultModelTemplateClassification?.templateName,
            modelVersions: [getMockedModelVersion({ isActiveModel: true })],
        }),
    ]);

    await render(<TrainModel isOpen onClose={onClose} onSuccess={onSuccess} />, {
        ...services,
        featureFlags: { FEATURE_FLAG_CREDIT_SYSTEM: false, FEATURE_FLAG_NEW_CONFIGURABLE_PARAMETERS: true },
        services: {
            ...services,
            supportedAlgorithmsService: services?.supportedAlgorithmsService ?? supportedAlgorithmsService,
            modelsService: services?.modelsService ?? modelsService,
            projectService: services?.projectService ?? projectService,
        },
    });
};

describe('Train model dialog', () => {
    it('displays message that training is not allowed', async () => {
        const projectService = createInMemoryProjectService();

        projectService.getProject = jest.fn(async () => mockedSingleProject);

        projectService.getProjectStatus = () =>
            Promise.resolve(
                getMockedProjectStatus({
                    tasks: [
                        getMockedProjectStatusTask({
                            id: mockedSingleProject.tasks[0].id,
                            ready_to_train: false,
                        }),
                    ],
                })
            );

        await renderTrainModelDialog({
            services: {
                projectService,
            },
        });

        expect(screen.getByRole('heading', { name: /not enough annotations/i })).toBeInTheDocument();
    });

    it('display task chain picker for task chain project only in basic mode', async () => {
        await renderTrainModelDialog({ project: mockedTaskChainProject });

        expect(screen.queryByRole('tablist', { name: /advanced settings tabs/i })).not.toBeInTheDocument();

        expect(screen.getByRole('button', { name: /select domain/i })).toBeInTheDocument();
    });

    it('does not display task chain picker in advanced mode', async () => {
        await renderTrainModelDialog({ project: mockedTaskChainProject });

        fireEvent.click(screen.getByRole('button', { name: /advanced settings/i }));
        expect(screen.getByRole('tablist', { name: /advanced settings tabs/i })).toBeInTheDocument();

        expect(screen.queryByRole('button', { name: /select domain/i })).not.toBeInTheDocument();
    });

    it('does not display task chain picker for non-task chain project', async () => {
        await renderTrainModelDialog({ project: mockedSingleProject });

        expect(screen.queryByRole('button', { name: /select domain/i })).not.toBeInTheDocument();
    });

    it('model type with default algorithm should be selected by default if there are no models', async () => {
        const modelsService = createInMemoryModelsService();
        modelsService.getModels = jest.fn(async () => []);

        await renderTrainModelDialog({
            services: {
                modelsService,
            },
        });

        const defaultModelTemplate = getDefaultModelTemplate(DOMAIN.DETECTION);

        expect(screen.getByLabelText('Selected card')).toHaveAttribute(
            'data-testid',
            idMatchingFormat(`${defaultModelTemplate?.performanceCategory.toLocaleLowerCase()}-id`)
        );
    });

    it('model type with default algorithm should be selected by default if there is no active model', async () => {
        const modelsService = createInMemoryModelsService();

        modelsService.getModels = jest.fn(async () => [
            getMockedModelsGroup({
                taskId: mockedSingleProject.tasks[0].id,
                modelTemplateId: mockedSupportedAlgorithms[1].modelTemplateId,
                modelVersions: [getMockedModelVersion({ isActiveModel: false })],
            }),
        ]);

        await renderTrainModelDialog({
            services: {
                modelsService,
            },
        });

        const defaultModelTemplate = getDefaultModelTemplate(DOMAIN.DETECTION);

        expect(screen.getByLabelText('Selected card')).toHaveAttribute(
            'data-testid',
            idMatchingFormat(`${defaultModelTemplate?.performanceCategory.toLocaleLowerCase()}-id`)
        );
    });

    it('model type which has active model should be selected by default when there are models', async () => {
        await renderTrainModelDialog();

        const defaultModelTemplate = getDefaultModelTemplate(DOMAIN.DETECTION);

        expect(screen.getByLabelText('Selected card')).toHaveAttribute(
            'data-testid',
            idMatchingFormat(`${defaultModelTemplate?.performanceCategory.toLocaleLowerCase()}-id`)
        );
    });

    it('selected model type changes when selected task changes', async () => {
        await renderTrainModelDialog({
            project: mockedTaskChainProject,
        });

        const defaultModelTemplateDetection = getDefaultModelTemplate(DOMAIN.DETECTION);
        const defaultModelTemplateClassification = getDefaultModelTemplate(DOMAIN.CLASSIFICATION);

        expect(screen.getByRole('button', { name: /detection select domain task/i })).toBeInTheDocument();

        expect(screen.getByLabelText('Selected card')).toHaveAttribute(
            'data-testid',
            idMatchingFormat(`${defaultModelTemplateDetection?.performanceCategory.toLocaleLowerCase()}-id`)
        );

        fireEvent.click(screen.getByRole('button', { name: /select domain/i }));
        fireEvent.click(screen.getByRole('option', { name: /classification/i }));

        expect(screen.getByLabelText('Selected card')).toHaveAttribute(
            'data-testid',
            idMatchingFormat(`${defaultModelTemplateClassification?.performanceCategory.toLocaleLowerCase()}-id`)
        );
    });

    it('calls only train endpoint when starting training in basic mode', async () => {
        const modelsService = createInMemoryModelsService();

        modelsService.trainModel = jest.fn();

        const configParametersService = createApiModelConfigParametersService();
        configParametersService.updateTrainingConfiguration = jest.fn();

        await renderTrainModelDialog({
            services: {
                modelsService,
                configParametersService,
            },
        });

        expect(screen.queryByRole('tablist', { name: /advanced settings tabs/i })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /start/i }));

        await waitFor(() => {
            expect(modelsService.trainModel).toHaveBeenCalled();
            expect(configParametersService.updateTrainingConfiguration).not.toHaveBeenCalled();
        });
    });

    it('calls training configuration and train endpoints when starting training in advanced mode', async () => {
        const modelsService = createInMemoryModelsService();

        const mockedTrainedModel = jest.fn();
        modelsService.trainModel = mockedTrainedModel;

        const configParametersService = createApiModelConfigParametersService();
        const mockedUpdateTrainingConfiguration = jest.fn();
        configParametersService.updateTrainingConfiguration = mockedUpdateTrainingConfiguration;
        configParametersService.getTrainingConfiguration = jest.fn(async () => getMockedTrainingConfiguration());

        await renderTrainModelDialog({
            services: {
                modelsService,
                configParametersService,
            },
        });

        fireEvent.click(screen.getByRole('button', { name: /advanced settings/i }));

        expect(screen.getByRole('tablist', { name: /advanced settings tabs/i })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /start/i }));

        await waitFor(() => {
            expect(mockedTrainedModel).toHaveBeenCalled();
            expect(mockedUpdateTrainingConfiguration).toHaveBeenCalled();
        });

        expect(mockedUpdateTrainingConfiguration.mock.invocationCallOrder[0]).toBeLessThan(
            mockedTrainedModel.mock.invocationCallOrder[0]
        );
    });

    it('does not call train endpoint when training configuration fails', async () => {
        const modelsService = createInMemoryModelsService();

        const mockedTrainedModel = jest.fn();
        modelsService.trainModel = mockedTrainedModel;

        const configParametersService = createApiModelConfigParametersService();
        const errorMessage = 'Training configuration update failed';
        const mockedUpdateTrainingConfiguration = jest.fn(() => {
            throw new Error(errorMessage);
        });
        configParametersService.updateTrainingConfiguration = mockedUpdateTrainingConfiguration;
        configParametersService.getTrainingConfiguration = jest.fn(async () => getMockedTrainingConfiguration());

        await renderTrainModelDialog({
            services: {
                modelsService,
                configParametersService,
            },
        });

        fireEvent.click(screen.getByRole('button', { name: /advanced settings/i }));

        expect(screen.getByRole('tablist', { name: /advanced settings tabs/i })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /start/i }));

        await waitFor(() => {
            expect(mockedUpdateTrainingConfiguration).toHaveBeenCalled();
            expect(mockedTrainedModel).not.toHaveBeenCalled();
        });

        expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('reset training configuration to defaults when training fails', async () => {
        const modelsService = createInMemoryModelsService();

        const errorMessage = 'Training failed';
        const mockedTrainedModel = jest.fn(() => {
            throw new Error(errorMessage);
        });
        modelsService.trainModel = mockedTrainedModel;

        const configParametersService = createApiModelConfigParametersService();
        const mockedUpdateTrainingConfiguration = jest.fn();
        configParametersService.updateTrainingConfiguration = mockedUpdateTrainingConfiguration;
        const filterParameter = {
            min_annotation_pixels: [
                getMockedConfigurationParameter({
                    key: 'enable',
                    type: 'bool',
                    name: 'Enable minimum annotation pixels filtering',
                    value: false,
                    description: 'Whether to apply minimum annotation pixels filtering',
                    defaultValue: false,
                }),
                getMockedConfigurationParameter({
                    key: 'min_annotation_pixels',
                    type: 'int',
                    name: 'Minimum annotation pixels',
                    value: 1,
                    description: 'Minimum number of pixels in an annotation',
                    defaultValue: 1,
                    maxValue: 200000000,
                    minValue: 0,
                }),
            ],
        };

        const trainingConfiguration = getMockedTrainingConfiguration({
            datasetPreparation: {
                subsetSplit: [],
                augmentation: {},
                filtering: filterParameter,
            },
        });
        configParametersService.getTrainingConfiguration = jest.fn(async () => trainingConfiguration);

        await renderTrainModelDialog({
            services: {
                modelsService,
                configParametersService,
            },
        });

        fireEvent.click(screen.getByRole('button', { name: /advanced settings/i }));

        expect(screen.getByRole('tablist', { name: /advanced settings tabs/i })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('tab', { name: /data management/i }));

        fireEvent.click(
            screen.getByRole('checkbox', { name: `Toggle ${filterParameter['min_annotation_pixels'][1].name}` })
        );

        fireEvent.click(screen.getByRole('button', { name: /start/i }));

        const updatedTrainingConfiguration = structuredClone(trainingConfiguration);
        filterParameter.min_annotation_pixels[0].value = true;
        updatedTrainingConfiguration.datasetPreparation.filtering = filterParameter;

        await waitFor(() => {
            expect(mockedTrainedModel).toHaveBeenCalled();
            expect(mockedUpdateTrainingConfiguration).toHaveBeenCalledTimes(2);
            expect(mockedUpdateTrainingConfiguration).toHaveBeenNthCalledWith(
                1,
                expect.anything(),
                updatedTrainingConfiguration,
                expect.anything()
            );
            expect(mockedUpdateTrainingConfiguration).toHaveBeenNthCalledWith(
                2,
                expect.anything(),
                trainingConfiguration,
                expect.anything()
            );
        });

        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(mockedUpdateTrainingConfiguration.mock.invocationCallOrder[0]).toBeLessThan(
            mockedTrainedModel.mock.invocationCallOrder[0]
        );
        expect(mockedUpdateTrainingConfiguration.mock.invocationCallOrder[1]).toBeGreaterThan(
            mockedTrainedModel.mock.invocationCallOrder[0]
        );
    });

    it('sends train from scratch and reshuffling enabled when training', async () => {
        const modelsService = createInMemoryModelsService();
        modelsService.trainModel = jest.fn();
        await renderTrainModelDialog({
            services: {
                modelsService,
            },
        });

        fireEvent.click(screen.getByRole('button', { name: /advanced settings/i }));
        fireEvent.click(screen.getByRole('tab', { name: /training/i }));

        fireEvent.click(screen.getByRole('radio', { name: /pre\-trained weights \- fine\-tune/i }));
        fireEvent.click(screen.getByRole('checkbox', { name: /reshuffle subsets/i }));

        fireEvent.click(screen.getByRole('button', { name: /start/i }));

        await waitFor(() => {
            expect(modelsService.trainModel).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    train_from_scratch: true,
                    reshuffle_subsets: true,
                    model_template_id: getDefaultModelTemplate(DOMAIN.DETECTION)?.modelTemplateId,
                })
            );
        });
    });

    it('back button is visible in advanced mode', async () => {
        await renderTrainModelDialog();

        fireEvent.click(screen.getByRole('button', { name: /advanced settings/i }));

        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('back button resets model type to recommended one when neither recommended nor active algorithm is selected', async () => {
        await renderTrainModelDialog();

        const defaultModelTemplate = getDefaultModelTemplate(DOMAIN.DETECTION);

        expect(screen.getByLabelText('Selected card')).toHaveAttribute(
            'data-testid',
            idMatchingFormat(`${defaultModelTemplate?.performanceCategory.toLocaleLowerCase()}-id`)
        );

        fireEvent.click(screen.getByRole('button', { name: /advanced settings/i }));

        const otherModelType = mockedSupportedAlgorithms.find(
            (algorithm) =>
                algorithm.performanceCategory === PerformanceCategory.OTHER && algorithm.domain === DOMAIN.DETECTION
        );

        fireEvent.click(screen.getByText(otherModelType?.name ?? ''));

        expect(screen.getByLabelText('Selected card')).toHaveAttribute(
            'data-testid',
            idMatchingFormat(`${otherModelType?.name}-id`)
        );

        fireEvent.click(screen.getByRole('button', { name: /back/i }));

        expect(screen.getByLabelText('Selected card')).toHaveAttribute(
            'data-testid',
            idMatchingFormat(`${defaultModelTemplate?.performanceCategory.toLocaleLowerCase()}-id`)
        );
    });

    it('back button resets to selected algorithm to default one when there are no models and neither recommended nor active is selected', async () => {
        const modelsService = createInMemoryModelsService();
        modelsService.getModels = jest.fn(async () => []);

        await renderTrainModelDialog({
            services: {
                modelsService,
            },
        });

        const defaultModelTemplate = getDefaultModelTemplate(DOMAIN.DETECTION);

        expect(screen.getByLabelText('Selected card')).toHaveAttribute(
            'data-testid',
            idMatchingFormat(`${defaultModelTemplate?.performanceCategory.toLocaleLowerCase()}-id`)
        );

        fireEvent.click(screen.getByRole('button', { name: /advanced settings/i }));

        const otherModelType = mockedSupportedAlgorithms.find(
            (algorithm) =>
                algorithm.performanceCategory === PerformanceCategory.OTHER && algorithm.domain === DOMAIN.DETECTION
        );

        fireEvent.click(screen.getByText(otherModelType?.name ?? ''));

        expect(screen.getByLabelText('Selected card')).toHaveAttribute(
            'data-testid',
            idMatchingFormat(`${otherModelType?.name}-id`)
        );

        fireEvent.click(screen.getByRole('button', { name: /back/i }));

        expect(screen.getByLabelText('Selected card')).toHaveAttribute(
            'data-testid',
            idMatchingFormat(`${defaultModelTemplate?.performanceCategory.toLocaleLowerCase()}-id`)
        );
    });
});
