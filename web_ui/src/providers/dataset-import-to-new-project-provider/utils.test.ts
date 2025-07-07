// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import {
    DATASET_IMPORT_STATUSES,
    DATASET_IMPORT_TASK_TYPE,
    DATASET_IMPORT_TO_NEW_PROJECT_STEP,
    DATASET_IMPORT_WARNING_TYPE,
} from '../../core/datasets/dataset.enum';
import { getFileSize } from '../../shared/utils';
import { getMockedUploadItem } from '../../test-utils/mocked-items-factory/mocked-dataset-import';
import { getMockedKeypointStructureDto } from '../../test-utils/mocked-items-factory/mocked-keypoint';
import {
    formatDatasetPrepareImportResponse,
    getBytesRemaining,
    getDatasetImportInitialState,
    getImportKeypointTask,
    getTimeRemaining,
    isKeypointType,
    isKeypointWithInvalidStructure,
    isValidKeypointStructure,
} from './utils';

jest.mock('../../shared/utils', () => ({
    ...jest.requireActual('../../shared/utils'),
    getFileSize: jest.fn(),
}));

describe('import to new project utils', () => {
    it('getDatasetImportInitialState', () => {
        const initData = { id: 'id-test', name: 'name-test', size: 'size-test' };
        expect(getDatasetImportInitialState(initData)).toEqual(
            expect.objectContaining({
                ...initData,
                status: DATASET_IMPORT_STATUSES.UPLOADING,
                activeStep: DATASET_IMPORT_TO_NEW_PROJECT_STEP.DATASET,
                openedSteps: [DATASET_IMPORT_TO_NEW_PROJECT_STEP.DATASET],
            })
        );
    });

    it('getBytesRemaining', () => {
        const mockedValue = 'test-time';
        jest.mocked(getFileSize).mockReturnValue(mockedValue);

        expect(getBytesRemaining(20)).toBe(`${mockedValue} left`);
        expect(getBytesRemaining(0)).toBe(``);
    });

    describe('formatDatasetPrepareImportResponse', () => {
        it('empty warnings', () => {
            const initData = {
                id: 'id-test',
                uploadId: 'uploadId-test',
                warnings: [],
                supportedProjectTypes: [],
            };
            expect(formatDatasetPrepareImportResponse(initData)).toEqual({
                ...initData,
                status: DATASET_IMPORT_STATUSES.TASK_TYPE_SELECTION_TO_NEW_PROJECT,
                activeStep: DATASET_IMPORT_TO_NEW_PROJECT_STEP.DOMAIN,
                completedSteps: [DATASET_IMPORT_TO_NEW_PROJECT_STEP.DATASET],
                openedSteps: [DATASET_IMPORT_TO_NEW_PROJECT_STEP.DATASET, DATASET_IMPORT_TO_NEW_PROJECT_STEP.DOMAIN],
            });
        });

        it('warnings', () => {
            const initData = {
                id: 'id-test',
                uploadId: 'uploadId-test',
                supportedProjectTypes: [],
                warnings: [
                    {
                        name: 'warning-test',
                        description: 'description-test',
                        type: DATASET_IMPORT_WARNING_TYPE.WARNING,
                    },
                ],
            };
            expect(formatDatasetPrepareImportResponse(initData)).toEqual({
                ...initData,
                status: DATASET_IMPORT_STATUSES.TASK_TYPE_SELECTION_TO_NEW_PROJECT,
                activeStep: DATASET_IMPORT_TO_NEW_PROJECT_STEP.DATASET,
                openedSteps: [DATASET_IMPORT_TO_NEW_PROJECT_STEP.DATASET],
                completedSteps: [],
            });
        });
    });

    describe('getTimeRemaining', () => {
        it('zero remaining bytes', () => {
            expect(getTimeRemaining(Date.now() - 10, 0, 100)).toEqual('');
        });

        it('10 remaining bytes', () => {
            expect(getTimeRemaining(Date.now() - 10, 90, 100)).toEqual('a few seconds left');
        });

        it('calculating', () => {
            expect(getTimeRemaining(Date.now(), 0, 0)).toEqual('Calculating...');
        });
    });

    describe('isKeypointType', () => {
        test.each([
            [DATASET_IMPORT_TASK_TYPE.KEYPOINT_DETECTION, true],
            [DATASET_IMPORT_TASK_TYPE.CLASSIFICATION, false],
            [DATASET_IMPORT_TASK_TYPE.DETECTION, false],
            [DATASET_IMPORT_TASK_TYPE.ANOMALY_CLASSIFICATION, false],
            [DATASET_IMPORT_TASK_TYPE.SEGMENTATION, false],
        ])('return %p for task type %s', (taskType, expected) => {
            expect(isKeypointType(taskType)).toBe(expected);
        });
    });

    describe('getImportKeypointTask', () => {
        const keypointTask = {
            title: 'Keypoint Detection',
            labels: [],
            taskType: DATASET_IMPORT_TASK_TYPE.KEYPOINT_DETECTION,
            keypointStructure: { edges: [], positions: [] },
        };

        const classificationTask = {
            title: 'Classification',
            labels: [],
            taskType: DATASET_IMPORT_TASK_TYPE.CLASSIFICATION,
        };

        it('returns null when keypoint type has no keypointStructure', () => {
            const supportedTypes = [
                {
                    projectType: DATASET_IMPORT_TASK_TYPE.KEYPOINT_DETECTION,
                    pipeline: {
                        tasks: [{ ...keypointTask, keypointStructure: undefined }],
                        connections: [],
                    },
                },
            ];
            expect(getImportKeypointTask(supportedTypes)).toBeNull();
        });

        it('returns keypoint task when found', () => {
            const supportedTypes = [
                {
                    projectType: DATASET_IMPORT_TASK_TYPE.KEYPOINT_DETECTION,
                    pipeline: {
                        tasks: [classificationTask, keypointTask],
                        connections: [],
                    },
                },
            ];
            expect(getImportKeypointTask(supportedTypes)).toEqual(keypointTask);
        });
    });

    describe('isValidKeypointStructure', () => {
        const mockedKeypointTask = {
            title: 'Keypoint Detection',
            labels: [],
            taskType: DATASET_IMPORT_TASK_TYPE.KEYPOINT_DETECTION,
            keypointStructure: getMockedKeypointStructureDto(),
        };

        it('returns true when keypointStructure has non-empty edges and positions', () => {
            expect(isValidKeypointStructure(mockedKeypointTask)).toBe(true);
        });

        it('returns false when keypointStructure has empty edges', () => {
            expect(
                isValidKeypointStructure({
                    ...mockedKeypointTask,
                    keypointStructure: getMockedKeypointStructureDto({ edges: [] }),
                })
            ).toBe(false);
        });

        it('returns false when keypointStructure has empty positions', () => {
            expect(
                isValidKeypointStructure({
                    ...mockedKeypointTask,
                    keypointStructure: getMockedKeypointStructureDto({ positions: [] }),
                })
            ).toBe(false);
        });
    });

    describe('isKeypointWithInvalidStructure', () => {
        const mockedClassificationTask = {
            title: 'Classification',
            taskType: DATASET_IMPORT_TASK_TYPE.CLASSIFICATION,
            labels: [],
        };
        const mockedKeypointTask = {
            title: 'Keypoint Detection',
            labels: [],
            taskType: DATASET_IMPORT_TASK_TYPE.KEYPOINT_DETECTION,
            keypointStructure: getMockedKeypointStructureDto(),
        };

        it('returns false when activeDatasetImport is undefined', () => {
            expect(isKeypointWithInvalidStructure(undefined)).toBe(false);
        });

        it('returns false when no keypoint task is found', () => {
            const activeDatasetImport = getMockedUploadItem({
                supportedProjectTypes: [
                    {
                        projectType: DATASET_IMPORT_TASK_TYPE.CLASSIFICATION,
                        pipeline: {
                            tasks: [mockedClassificationTask],
                            connections: [],
                        },
                    },
                ],
            });

            expect(isKeypointWithInvalidStructure(activeDatasetImport)).toBe(false);
        });

        it('returns true when keypoint task has invalid structure', () => {
            const activeDatasetImport = getMockedUploadItem({
                supportedProjectTypes: [
                    {
                        projectType: DATASET_IMPORT_TASK_TYPE.KEYPOINT_DETECTION,
                        pipeline: {
                            tasks: [
                                {
                                    ...mockedKeypointTask,
                                    keypointStructure: getMockedKeypointStructureDto({ positions: [] }),
                                },
                            ],
                            connections: [],
                        },
                    },
                ],
            });

            expect(isKeypointWithInvalidStructure(activeDatasetImport)).toBe(true);
        });

        it('returns false when keypoint task has valid structure', () => {
            const activeDatasetImport = getMockedUploadItem({
                supportedProjectTypes: [
                    {
                        projectType: DATASET_IMPORT_TASK_TYPE.KEYPOINT_DETECTION,
                        pipeline: {
                            tasks: [mockedKeypointTask],
                            connections: [],
                        },
                    },
                ],
            });

            expect(isKeypointWithInvalidStructure(activeDatasetImport)).toBe(false);
        });
    });
});
