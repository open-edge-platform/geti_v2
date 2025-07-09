// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ApplicationServicesContextProps } from '@geti/core/src/services/application-services-provider.component';
import { fireEvent, screen, waitForElementToBeRemoved } from '@testing-library/react';
import dayjs from 'dayjs';

import { ModelsGroups } from '../../../../core/models/models.interface';
import { PerformanceType } from '../../../../core/projects/task.interface';
import {
    LifecycleStage,
    PerformanceCategory,
} from '../../../../core/supported-algorithms/dtos/supported-algorithms.interface';
import { createInMemorySupportedAlgorithmsService } from '../../../../core/supported-algorithms/services/in-memory-supported-algorithms-service';
import { getLegacyMockedSupportedAlgorithm } from '../../../../core/supported-algorithms/services/test-utils';
import { getMockedModelsGroup, getMockedModelVersion } from '../../../../test-utils/mocked-items-factory/mocked-model';
import { getMockedSupportedAlgorithm } from '../../../../test-utils/mocked-items-factory/mocked-supported-algorithms';
import { providersRender as render } from '../../../../test-utils/required-providers-render';
import { ModelSelection } from './model-selection.component';

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({
        projectId: 'project-id',
        organizationId: 'organization-id',
        workspaceId: 'workspace_1',
    }),
}));

const renderApp = async ({
    models,
    services,
}: {
    services?: Partial<ApplicationServicesContextProps>;
    models: ModelsGroups[];
}) => {
    render(
        <ModelSelection
            models={models}
            selectModel={jest.fn()}
            selectedModel={{
                modelGroupId: '',
                versionId: '',
                optimisationId: undefined,
                modelId: '',
            }}
        />,
        { services }
    );

    await waitForElementToBeRemoved(screen.getByRole('progressbar'));
};

describe('ModelSelection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const modelVersionsYolo = [
        getMockedModelVersion({
            id: '3',
            groupName: 'YoloV4',
            modelSize: 120000,
            performance: { score: 0.9, type: PerformanceType.DEFAULT },
            isActiveModel: false,
            creationDate: dayjs().subtract(1, 'day').toString(),
            version: 1,
            isLabelSchemaUpToDate: true,
        }),
        getMockedModelVersion({
            groupId: '4',
            groupName: 'YoloV4',
            modelSize: 140000,
            performance: { score: 0.95, type: PerformanceType.DEFAULT },
            isActiveModel: false,
            creationDate: dayjs().toString(),
            version: 2,
            isLabelSchemaUpToDate: true,
        }),
    ];

    const modelVersionsAtts = [
        getMockedModelVersion({
            groupId: '1',
            groupName: 'ATSS',
            performance: { score: 0.24, type: PerformanceType.DEFAULT },
            modelSize: 220000,
            isActiveModel: false,
            creationDate: dayjs().subtract(1, 'd').toString(),
            version: 1,
            isLabelSchemaUpToDate: true,
        }),
        getMockedModelVersion({
            groupId: '2',
            groupName: 'ATSS',
            modelSize: 140000,
            performance: { score: 0.71, type: PerformanceType.DEFAULT },
            isActiveModel: false,
            creationDate: dayjs().toString(),
            version: 2,
            isLabelSchemaUpToDate: true,
        }),
    ];

    const models = [
        getMockedModelsGroup({
            groupId: 'model-group-1-id',
            groupName: 'YoloV4',
            modelTemplateId: 'Custom_Object_Detection_Gen3_SSD',
            taskId: '1234',
            modelVersions: modelVersionsYolo,
            lifecycleStage: LifecycleStage.ACTIVE,
        }),
        getMockedModelsGroup({
            groupId: 'model-group-2-id',
            groupName: 'ATSS',
            modelTemplateId: 'Custom_Semantic_Segmentation_Lite-HRNet-18-mod2_OCR',
            taskId: '1235',
            modelVersions: modelVersionsAtts,
            lifecycleStage: LifecycleStage.ACTIVE,
        }),
    ];

    it('render all model architectures and performance categories', async () => {
        const supportedAlgorithmsService = createInMemorySupportedAlgorithmsService();
        supportedAlgorithmsService.getLegacyProjectSupportedAlgorithms = jest.fn(async () => [
            getLegacyMockedSupportedAlgorithm({
                modelTemplateId: 'Custom_Object_Detection_Gen3_SSD',
                performanceCategory: PerformanceCategory.SPEED,
            }),
            getLegacyMockedSupportedAlgorithm({
                modelTemplateId: 'Custom_Semantic_Segmentation_Lite-HRNet-18-mod2_OCR',
                performanceCategory: PerformanceCategory.ACCURACY,
            }),
        ]);
        supportedAlgorithmsService.getProjectSupportedAlgorithms = jest.fn(async () => [
            getMockedSupportedAlgorithm({
                modelTemplateId: 'Custom_Object_Detection_Gen3_SSD',
                performanceCategory: PerformanceCategory.SPEED,
            }),
            getMockedSupportedAlgorithm({
                modelTemplateId: 'Custom_Semantic_Segmentation_Lite-HRNet-18-mod2_OCR',
                performanceCategory: PerformanceCategory.ACCURACY,
            }),
        ]);

        await renderApp({
            models,
            services: {
                supportedAlgorithmsService,
            },
        });

        fireEvent.click(screen.getByRole('button', { name: /architecture/i }));

        expect(await screen.findByRole('option', { name: `YoloV4 (Speed)` })).toBeVisible();
        expect(await screen.findByRole('option', { name: `ATSS (Accuracy)` })).toBeVisible();
    });

    it('does not render performance category if it is OTHER', async () => {
        const supportedAlgorithmsService = createInMemorySupportedAlgorithmsService();
        supportedAlgorithmsService.getLegacyProjectSupportedAlgorithms = jest.fn(async () => [
            getLegacyMockedSupportedAlgorithm({
                modelTemplateId: 'Custom_Object_Detection_Gen3_SSD',
                performanceCategory: PerformanceCategory.OTHER,
            }),
        ]);
        supportedAlgorithmsService.getProjectSupportedAlgorithms = jest.fn(async () => [
            getMockedSupportedAlgorithm({
                modelTemplateId: 'Custom_Object_Detection_Gen3_SSD',
                performanceCategory: PerformanceCategory.OTHER,
            }),
        ]);
        await renderApp({
            models,
            services: {
                supportedAlgorithmsService,
            },
        });

        fireEvent.click(screen.getByRole('button', { name: /architecture/i }));

        expect(screen.getByRole('option', { name: `YoloV4` })).toBeVisible();
    });

    it('render all model versions', async () => {
        const [selectedModel] = models;
        await renderApp({ models });

        fireEvent.click(screen.getByRole('button', { name: /select version/i }));

        selectedModel.modelVersions.forEach(({ version }) => {
            expect(screen.getByRole('option', { name: `Version ${version}` })).toBeVisible();
        });
    });

    it('filter deleted model versions', async () => {
        const modelVersion = models[0].modelVersions[0];
        const deletedVersion = getMockedModelVersion({
            ...modelVersion,
            purgeInfo: {
                isPurged: true,
                userId: null,
                purgeTime: null,
            },
        });

        const modelGroupsWithDeletedModels = [
            {
                ...models[0],
                modelVersions: [deletedVersion, models[0].modelVersions[1]],
            },
        ];

        await renderApp({
            models: modelGroupsWithDeletedModels,
        });

        fireEvent.click(screen.getByRole('button', { name: /select version/i }));

        modelGroupsWithDeletedModels[0].modelVersions.forEach(({ id, version }) => {
            if (deletedVersion.id === id) {
                expect(screen.queryByRole('option', { name: `Version ${version}` })).not.toBeInTheDocument();
            } else {
                expect(screen.getByRole('option', { name: `Version ${version}` })).toBeVisible();
            }
        });
    });
});
